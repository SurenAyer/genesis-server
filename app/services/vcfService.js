var logger = require("../../config/logger");
var Promise = require('bluebird');
const { input } = require("../../config/logger");
var shell = require('shelljs');
const Cryptr = require('cryptr');
const cryptr = new Cryptr('myTotalySecretKey');
const { TabixIndexedFile } = require('@gmod/tabix');
const VCF = require('@gmod/vcf').default;
const modelsPromise = require('../../config/db-config');
const tbiIndexed = new TabixIndexedFile({ path: 'app/files/' });
const async = require('async');
const { default: TabixIndex } = require("@gmod/tabix/dist/tbi");
const { RemoteFile } = require('generic-filehandle')
const cassandra = require('cassandra-driver');
const { log } = require("console");
const client = new cassandra.Client({ contactPoints: ['localhost'], localDataCenter: 'datacenter1' });

let fetch;

import('node-fetch').then(nodeFetch => {
    fetch = nodeFetch;
}).catch(err => {
    console.error('Failed to load node-fetch', err);
});

var vcfService = {
    processVCFMetaData: processVCFMetaData,
    uploadVCF: uploadVCF,
    getAllVariants: getAllVariants,
    getMetaData: getMetaData,
    getSingleVariant: getSingleVariant,
    getAllMetaData: getAllMetaData,
    searchVariantSets: searchVariantSets,
    searchReferences: searchReferences,
    searchSamples: searchSamples,
    searchAlleleMatrix: searchAlleleMatrix
}




async function processVCFMetaData(fileInput) {
    let referenceName = fileInput.referenceName;
    let fileName = fileInput.fileName;
    let isRemoteFile = fileInput.isRemoteFile;
    let tbiIndexed = null;
    if (isRemoteFile) {
        tbiIndexed = new TabixIndexedFile({
            filehandle: new RemoteFile(fileName),
            tbiFilehandle: new RemoteFile(fileName + '.tbi'), // can also be csiFilehandle
        })
    }
    else {
        let filePath = 'app/files/' + fileName;
        tbiIndexed = new TabixIndexedFile({ path: filePath });
    }

    const models = await modelsPromise;
    const MetaData = models.instance.MetaData;
    let response = {};
    return new Promise(async function (resolve, reject) {
        try {
            const headerText = await tbiIndexed.getHeader();
            headerData = headerText.split('\n');
            const tbiVCFParser = new VCF({ header: headerText });
            let metaInfo = tbiVCFParser.getMetadata();
            const fileFormat = metaInfo.fileformat;

            const variants = [];
            let format = {
                dataFormat: "VCF",
                fileFormat: fileFormat,
                fileURL: fileName
            };

            let availableFormats = [JSON.stringify(format)];

            var metaData = new MetaData({
                databaseName: fileInput.databaseName,
                projectId: fileInput.projectId,
                studyDbId: fileInput.databaseName + '$' + fileInput.projectId,
                referenceName: fileInput.referenceName,
                variantCount: 0,
                callSetCount: 0,
                availableFormats: availableFormats,
                metaInfo: JSON.stringify(metaInfo)
            });
            await metaData.save(function (err) {
                if (err) {
                    console.log(err);
                    reject(err);
                    return;
                }
                console.log('Metadata saved!');
            });
            await tbiIndexed.lineCount(referenceName).then((count) => {
                response.totalVariants = count;
            }
            ).catch((error) => {
                console.log("Error in getting line count", error);
                reject(error);
            }
            );
            response.databaseName = metaData.databaseName;
            response.projectId = metaData.projectId;
            response.studyDbId = metaData.studyDbId;
            response.referenceName = metaData.referenceName;
            response.variantCount = metaData.variantCount;
            response.callSetCount = metaData.callSetCount;
            response.availableFormats = [format];
            response.metaInfo = metaInfo;

            resolve(response);
        } catch (error) {
            reject(error);
        }
    });
}

async function uploadVCF(fileDetails) {
    let chrom = fileDetails.chrom;
    let studyDbId = fileDetails.studyDbId;
    let databaseName = studyDbId.split('$')[0];
    let projectId = studyDbId.split('$')[1];
    let fileName = fileDetails.fileName;
    let isRemoteFile = fileDetails.isRemoteFile;
    console.log("File Details", fileDetails);
    let variantsRemaining = fileDetails.variantsRemaining;
    const rangeBegin = fileDetails.rangeBegin;
    const rangeEnd = fileDetails.rangeEnd;

    let tbiIndexed = null;
    if (isRemoteFile) {
        tbiIndexed = new TabixIndexedFile({
            filehandle: new RemoteFile(fileName),
            tbiFilehandle: new RemoteFile(fileName + '.tbi') // can also be csiFilehandle
        })
    }
    else {
        let filePath = 'app/files/' + fileName;
        tbiIndexed = new TabixIndexedFile({ path: filePath });
    }
    const models = await modelsPromise;
    const Variant = models.instance.Variant;
    const MetaData = models.instance.MetaData;
    let response = {};
    return new Promise(async function (resolve, reject) {
        try {
            const headerText = await tbiIndexed.getHeader();
            const tbiVCFParser = new VCF({ header: headerText });
            const variants = [];
            let counter = 0;
            let sampleCount = 0;

            console.log("Reading Variants");
            await tbiIndexed.getLines(chrom, rangeBegin, rangeEnd, line => {
                try {
                    const variant = tbiVCFParser.parseLine(line);
                    const variantWithSamples = { ...variant, SAMPLES: variant.SAMPLES };
                    var variantModel = new Variant({
                        studyDbId: studyDbId,
                        databaseName: databaseName,
                        projectId: projectId,
                        CHROM: variant.CHROM,
                        POS: variant.POS,
                        ALT: variant.ALT,
                        INFO: JSON.stringify(variant.INFO),
                        REF: variant.REF,
                        FILTER: JSON.stringify(variant.FILTER),
                        ID: variant.ID,
                        QUAL: variant.QUAL,
                        SAMPLES: Object.fromEntries(
                            Object.entries(variantWithSamples.SAMPLES).map(([key, value]) => [key, JSON.stringify(value)])
                        )
                    });
                    variants.push(variantModel);
                }
                catch (error) {
                    console.log("Error in processing line", error);
                    reject(error);
                }
            });
            // console.log("Saving Variants");
            await async.eachLimit(variants, 1000, function (variantModel, callback) {
                variantModel.save(function (err) {
                    if (err) {
                        console.log("Error in DB Save=" + err);
                        callback(err);
                    } else {
                        counter++;
                        console.log('variant saved!');
                        callback();
                    }
                });
            }, function (err) {
                if (err) {
                    reject(err);
                } else {
                    response.variantsUploaded = counter;
                    response.variantsRemaining = variantsRemaining - counter;
                    let lastVariant = variants[variants.length - 1];
                    lastVariant.INFO = JSON.parse(lastVariant.INFO);
                    lastVariant.FILTER = JSON.parse(lastVariant.FILTER);
                    lastVariant.SAMPLES = lastVariant.SAMPLES;
                    response.lastVariant = lastVariant;
                    resolve(response);
                }
            });


            console.log("Updating MetaData");
            //Find MetaData and update the variant count
            let metaData = {};
            await MetaData.findOne({ studyDbId: studyDbId, referenceName: chrom }, function (err, metaDataDb) {
                if (err) {
                    console.log(err);
                    reject(err);
                } else {
                    metaData = metaDataDb;
                    metaData.variantCount = metaData.variantCount + counter;
                    if (metaData.callSetCount == 0) {
                        let samples = JSON.parse(variants[0].SAMPLES);
                        metaData.callSetCount = Object.keys(samples).length;
                    }
                    metaData.save(function (err) {
                        if (err) {
                            console.log(err);
                            reject(err);
                        }
                        console.log('Metadata saved!');
                        resolve(response);
                    });
                }
            });


        } catch (error) {
            reject(error);
        }
    });
}

async function getAllVariants(input) {
    const models = await modelsPromise;
    const Variant = models.instance.Variant;
    const variants = [];
    let pageState = input.pageState;
    let fetchSize = parseInt(input.fetchSize);

    return new Promise((resolve, reject) => {
        Variant.eachRow({}, { fetchSize: fetchSize, pageState: pageState }, function (n, row) {
            const variant = {
                fileId: row.fileId,
                CHROM: row.CHROM,
                POS: row.POS,
                ALT: row.ALT,
                INFO: JSON.parse(row.INFO),
                REF: row.REF,
                FILTER: JSON.parse(row.FILTER),
                ID: row.ID,
                QUAL: row.QUAL,
                SAMPLES: row.SAMPLES
            };
            //console.log("Variant", variant);
            variants.push(variant);
        }, function (err, result) {
            if (err) {
                console.log(err);
                reject(err);
            } else {
                console.log('variants fetched!', variants.length);
                // store the next paging state
                pageState = result.pageState;
                resolve({
                    retrievedVariants: variants.length,
                    pageState: pageState,
                    variants: variants


                });
            }
        });
    });
}

async function getSingleVariant(input) {
    const chrom = input.referenceName;
    const pos = parseInt(input.position);
    const studyDbId = input.studyDbId;
    const databaseName=studyDbId.split('$')[0];
    const projectId = studyDbId.split('$')[1];
    console.log("Chrom", chrom);
    console.log("Pos", pos);
    const models = await modelsPromise;
    const Variant = models.instance.Variant;
    return new Promise(async function (resolve, reject) {
        try {
            Variant.findOne({ CHROM: chrom, POS: pos,databaseName:databaseName,projectId:projectId }, function (err, row) {
                if (err) {
                    console.log(err);
                    reject(err);
                } else {
                    const variant = {
                        fileId: row.fileId,
                        CHROM: row.CHROM,
                        POS: row.POS,
                        ALT: row.ALT,
                        INFO: JSON.parse(row.INFO),
                        REF: row.REF,
                        FILTER: JSON.parse(row.FILTER),
                        ID: row.ID,
                        QUAL: row.QUAL,
                        SAMPLES: row.SAMPLES
                    };
                    console.log('variant fetched!');
                    resolve(variant);
                }
            });
        }
        catch (error) {
            reject(error);
        }
    });
}


async function getMetaData(input) {
    const studyDbId = input.studyDbId;
    const referenceName = input.referenceName;
    const models = await modelsPromise;
    const MetaData = models.instance.MetaData;
    return new Promise(async function (resolve, reject) {
        try {
            MetaData.findOne({ studyDbId: studyDbId, referenceName: referenceName }, function (err, metaData) {
                if (err) {
                    console.log(err);
                    reject(err);
                } else {
                    if (metaData == null || metaData == undefined) {
                        reject("No Metadata found for the studyDbId=" + studyDbId + " and referenceName=" + referenceName);
                    }
                    console.log('metadata fetched!', metaData);
                    metaData.metaInfo = JSON.parse(metaData.metaInfo);
                    resolve(metaData);
                }
            });
        }
        catch (error) {
            reject(error);
        }
    });
}

async function getAllMetaData() {
    const models = await modelsPromise;
    const MetaData = models.instance.MetaData;
    return new Promise(async function (resolve, reject) {
        try {
            MetaData.find({}, function (err, metaDatas) {
                if (err) {
                    console.log(err);
                    reject(err);
                } else {
                    if (metaDatas == null || metaDatas == undefined) {
                        reject("No Metadata found");
                    }
                    for (metaData of metaDatas) {
                        metaData.metaInfo = JSON.parse(metaData.metaInfo);
                    }
                    resolve(metaDatas);
                }
            });
        }
        catch (error) {
            reject(error);
        }
    });
}

async function searchVariantSets(input) {
    const models = await modelsPromise;
    const MetaData = models.instance.MetaData;
    return new Promise(async function (resolve, reject) {
        try {
            MetaData.find({}, function (err, variantSets) {
                if (err) {
                    console.log(err);
                    reject(err);
                } else {
                    if (variantSets == null || variantSets == undefined) {
                        reject("No Variant Sets Found");
                    }
                    let responseVariantSets = [];
                    console.log('Variant Sets Fetched!');
                    for (let variantSet of variantSets) {
                        let variantSetObj = {
                            availableFormats: [JSON.parse(variantSet.availableFormats)],
                            callSetCount: variantSet.callSetCount,
                            referenceSetDbId: variantSet.studyDbId,
                            studyDbId: variantSet.studyDbId,
                            variantCount: variantSet.variantCount,
                            variantSetDbId: variantSet.studyDbId + "$" + variantSet.referenceName,
                            variantSetName: variantSet.referenceName,
                            metaFields: JSON.parse(variantSet.metaInfo),
                        }
                        responseVariantSets.push(variantSetObj);
                    }
                    let count = responseVariantSets.length;
                    let response = new Response();
                    response.metaData = {
                        pagination:
                        {
                            pageSize: count,
                            totalCount: count,
                            totalPages: 1,
                            currentPage: 0
                        }
                    };
                    response.result = { data: responseVariantSets };
                    resolve(response);
                }
            });
        }
        catch (error) {
            console.log("Error", error);
            reject(error);
        }
    });
}

async function searchReferences(input) {
    const models = await modelsPromise;
    const MetaData = models.instance.MetaData;
    let studyDbIds = input.studyDbIds;
    console.log("StudyDbIds", studyDbIds);
    let references = [];
    return new Promise(async function (resolve, reject) {
        try {
            for (let studyDbId of studyDbIds) {

                await MetaData.find({ studyDbId: studyDbId }, "referenceName", function (err, documents) {
                    if (err) {
                        console.log(err);
                        reject(err);
                    } else {
                        let referenceNames = documents.map(doc => doc.referenceName);
                        console.log('Reference Names Fetched!', referenceNames);
                        for (referenceName of referenceNames) {
                            let referenceObj = {
                                referenceDbId: studyDbId + "$0$" + referenceName, //Confusion about $0 value
                                referenceName: referenceName,
                                referenceSetDbId: studyDbId + "$0"
                            }
                            references.push(referenceObj);
                        }
                        let count = references.length;
                        let response = new Response();
                        response.metaData = {
                            pagination:
                            {
                                pageSize: count,
                                totalCount: count,
                                totalPages: 1,
                                currentPage: 0
                            }
                        };
                        response.result = { data: references };
                        resolve(response);
                    }

                });

            }

        }
        catch (error) {
            console.log("Error", error);
            reject(error);
        }
    });
}

async function searchSamples(input) {
    const models = await modelsPromise;
    const MetaData = models.instance.MetaData;
    const Variant = models.instance.Variant;
    let programDbIds = input.programDbIds;
    let responseData = [];
    return new Promise(async function (resolve, reject) {
        try {
            for (let programDbId of programDbIds) {

                const query = 'SELECT DISTINCT "studyDbId" FROM "' + programDbId + '".MetaData;';
                const result = await client.execute(query);
                const studyDbIds = result.rows.map(row => row.studyDbId);
                console.log('StudyDbIds Fetched!', studyDbIds);
                //Make Key-Value pair of databasename and projectId
                let studyDbIdMap = new Map();
                for (let studyDbId of studyDbIds) {
                    let databaseName = studyDbId.split('$')[0];
                    let projectId = studyDbId.split('$')[1];
                    if (!studyDbIdMap.has(databaseName)) {
                        studyDbIdMap.set(databaseName, [projectId]);
                    }
                    else {
                        let projects = studyDbIdMap.get(databaseName);
                        projects.push(projectId);
                        studyDbIdMap.set(databaseName, projects);
                    }
                }

                console.log('MetaDta Fetched!', studyDbIdMap);
                //Extract samples
                for (let [databaseName, projectIds] of studyDbIdMap) {
                    for (let projectId of projectIds) {
                        console.log('DatabaseName', databaseName);
                        console.log('ProjectId', projectId);
                        //let firstRows = await Variant.findOne({ databaseName: databaseName, projectId: projectId }, "SAMPLES", { limit: 1 });
                        const query = 'SELECT "SAMPLES", "CHROM" FROM "' + programDbId + '".Variant WHERE "databaseName" = ' + "'" + databaseName + "'" + ' AND "projectId" = ' + "'" + projectId + "'" + ' LIMIT 1 ALLOW FILTERING';
                        const result = await client.execute(query);
                        const samples = result.rows[0]['SAMPLES'];
                        const referenceName = result.rows[0]['CHROM'];

                        for (let sample of Object.keys(samples)) {
                            let data = {
                                additionalInfo: {},
                                germplasmDbId: databaseName + "$" + sample,
                                sampleDbId: databaseName + "$" + projectId,
                                sampleName: sample + "-" + projectId + "-" + referenceName,
                                studyDbId: databaseName + "$" + projectId
                            }
                            responseData.push(data);
                        }
                    }
                }

                let count = responseData.length;
                let response = new Response();
                response.metaData = {
                    pagination:
                    {
                        pageSize: count,
                        totalCount: count,
                        totalPages: 1,
                        currentPage: 0
                    }
                };
                response.result = { data: responseData };
                resolve(response);
            }

        } catch (err) {
            console.error(err);
            reject(err);
        }

    });
}

async function searchAlleleMatrix(input) {
    let callSetDbIds = input.callSetDbIds;
    let variantSetDbId = input.variantSetDbId;
    let dataMatrixAbbreviations = input.dataMatrixAbbreviations;
    let variantDbIds;
    let databaseName;
    //let projectId;
    let chrom;
    let isRangeProvided = false;
    let positionMap = new Map();
    const models = await modelsPromise;
    const MetaData = models.instance.MetaData;
    const Variant = models.instance.Variant;
    let programDbIds = input.programDbIds;
    let positionRanges = input.positionRanges;
    let formatMap;
    let variantCounts = 0;

    if (input.variantDbIds != undefined) {

        variantDbIds = input.variantDbIds;
        databaseName = variantSetDbId.split('$')[0];
        //projectId=variantSetDbId.split('$')[1];
        chrom = variantSetDbId.split('$')[2];
    }
    else {
        isRangeProvided = true;
        databaseName = variantSetDbId.split('$')[0];
    }
    let alleleMatrix = [];
    let alleleMap = new Map();
    for (let abbr of dataMatrixAbbreviations) {
        alleleMap.set(abbr, []);
    }
    let responseData = {
        callSetDbIds: callSetDbIds,
        dataMatrices: [],
        pagination:[],
        sepPhased: "|",
        sepUnphased: "/",
        unknownString: ".",
        variantDbIds: [],
        variantSetDbIds: [variantSetDbId]


    }


    return new Promise(async function (resolve, reject) {
        try {
            let studyDbId = variantSetDbId.split('$')[0] + '$' + variantSetDbId.split('$')[1];
            await MetaData.findOne({ studyDbId: studyDbId }, "metaInfo", function (err, result) {
                if (err) {
                    console.log(err);
                    reject(err);
                } else {
                    formatMap = new Map(Object.entries(JSON.parse(result.metaInfo).FORMAT));
                  }
            });
            //Start processing
            console.log("Processing Allele Matrix", isRangeProvided);
            if (!isRangeProvided) {
                let i = 0;
                for (let variantDbId of variantDbIds) {
                    let variantPos = parseInt(variantDbId.split('$')[1]);
                    await Variant.findOne({ CHROM: chrom, POS: variantPos, databaseName: databaseName, }, function (err, variant) {
                        if (err) {
                            console.log(err);
                            reject(err);
                        } else {
                            let samplesMap = new Map();
                            samplesMap = variant.SAMPLES;

                            let j = 0;
                            let alleleRow = new Map();
                            for (let callSetDbId of callSetDbIds) {
                                let sampleName = callSetDbId.split('$')[1];
                                let sample = JSON.parse(samplesMap[sampleName]);

                                for (let abbr of dataMatrixAbbreviations) {
                                    let alleleData;
                                    if (alleleRow.get(abbr) == undefined)
                                        alleleRow.set(abbr, []);
                                    if (sample[abbr] == null)
                                        alleleData = null;
                                    else if (sample[abbr].length == 1) {
                                        alleleData = sample[abbr][0];
                                    } else
                                        alleleData = sample[abbr];
                                    alleleRow.get(abbr).push(alleleData);
                                }
                                j++;
                            }
                            for (let abbr of dataMatrixAbbreviations) {
                                alleleMap.get(abbr).push(alleleRow.get(abbr));
                            }
                            console.log("AlleleMap", alleleMap);
                            let length = dataMatrixAbbreviations.length;
                            // console.log("AlleleMatrix", alleleMatrix);
                            let lastAbbr = dataMatrixAbbreviations[length - 1];
                            console.log("LastAbbr", lastAbbr);
                            if (alleleMap.get(lastAbbr).length == variantDbIds.length) {
                                for (let abbr of alleleMap.keys()) {
                                    let dataMatrixResponse = {
                                        dataMatrix: alleleMap.get(abbr),
                                        dataMatrixAbbreviation: abbr,
                                        dataMatrixName: formatMap.get(abbr).Description,
                                        dataType: formatMap.get(abbr).Type
                                    }
                                    responseData.dataMatrices.push(dataMatrixResponse);
                                }
                                responseData.variantDbIds.push(variantDbIds);
                                let variantCount = variantDbIds.length;
                                let paginationVariant={
                                    dimension: "VARIANTS", 
                                    page: 0, 
                                    pageSize: variantCount, 
                                    totalCount: variantCount, 
                                    totalPages: 1
                                }
                                responseData.pagination.push(paginationVariant);
                                let callSetCount = callSetDbIds.length;
                                let paginationCallSet={
                                    dimension: "CALLSETS", 
                                    page: 0, 
                                    pageSize: callSetCount, 
                                    totalCount: callSetCount, 
                                    totalPages: 1
                                }
                                responseData.pagination.push(paginationCallSet);
                                
                                let response = new Response();
                                response.metaData = {};
                                response.result = responseData;
                                resolve(response);
                            }
                        }
                        i++;
                    }

                    );


                }

            }

            else {
                let processedCount = 0;
                for (let range of positionRanges) {
                    let chrom = range.split(':')[0];
                    let start = range.split(':')[1].split('-')[0];
                    let end = range.split(':')[1].split('-')[1];
                    let query = 'SELECT "SAMPLES", "POS" FROM "' + databaseName + '".Variant WHERE "CHROM" = \'' + chrom + '\' AND "databaseName" = \'' + databaseName + '\' AND "POS" >= ' + parseInt(start) + ' AND "POS" <= ' + parseInt(end) + ' ALLOW FILTERING';
                    const result = await client.execute(query);
                    const rows = result.rows;
                    for (let row of rows) {
                        variantCounts++;
                        let samplesMap = new Map();
                        samplesMap = row['SAMPLES'];
                        let variantDbId = databaseName + "$" + row['POS'];
                        responseData.variantDbIds.push(variantDbId);

                        let alleleRow = new Map();
                        for (let callSetDbId of callSetDbIds) {
                            let sampleName = callSetDbId.split('$')[1];
                            let sample = JSON.parse(samplesMap[sampleName]);
                            for (let abbr of dataMatrixAbbreviations) {
                                let alleleData;
                                if (alleleRow.get(abbr) == undefined)
                                    alleleRow.set(abbr, []);
                                if (sample[abbr] == null)
                                    alleleData = null;
                                else if (sample[abbr].length == 1) {
                                    alleleData = sample[abbr][0];
                                } else
                                    alleleData = sample[abbr];
                                alleleRow.get(abbr).push(alleleData);
                            }
                        }
                        processedCount++;
                        for (let abbr of dataMatrixAbbreviations) {
                            alleleMap.get(abbr).push(alleleRow.get(abbr));
                        }
                        if (processedCount === positionRanges.length) {
                            for (let abbr of alleleMap.keys()) {
                                let dataMatrixResponse = {
                                    dataMatrix: alleleMap.get(abbr),
                                    dataMatrixAbbreviation: abbr,
                                    dataMatrixName: formatMap.get(abbr).Description,
                                    dataType: formatMap.get(abbr).Type
                                }
                                responseData.dataMatrices.push(dataMatrixResponse);
                            }
                            let paginationVariant={
                                dimension: "VARIANTS", 
                                page: 0, 
                                pageSize: variantCounts, 
                                totalCount: variantCounts, 
                                totalPages: 1
                            }
                            responseData.pagination.push(paginationVariant);

                            let callSetCount = callSetDbIds.length;
                            let paginationCallSet={
                                dimension: "CALLSETS", 
                                page: 0, 
                                pageSize: callSetCount, 
                                totalCount: callSetCount, 
                                totalPages: 1
                            }
                            responseData.pagination.push(paginationCallSet);
                            let response = new Response();
                            response.metaData = {};
                            response.result = responseData;
                            resolve(response);
                        }
                    }

                }

            }
        } catch (err) {
            console.error("ERROR OCCURED", err);
            reject(err);
        }

    });
}
module.exports = vcfService;