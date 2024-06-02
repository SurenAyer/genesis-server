var vcfService = require("../services/vcfService.js");
var Response = require("../util/response.js");
var logger = require("../../config/logger.js");

var vcfController = {
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
//Add new Response() to all the responses

function processVCFMetaData(req, res) {
    try {
        var response = new Response();
        var fileDetails = req.body;
        vcfService.processVCFMetaData(fileDetails).then(function (data) {
            response.status.statusCode = '200';
            response.result=data;
            response.status.message = "VCF MetaData Processed Successfully!!";
            res.status(200).json(response);
        }).catch(function (err) {
            logger.error(`Error Occured: ${err}`);
            if (err.code == 401) {
                let response=new Response();
                response.status.code = "401";
                response.status.message = "Unauthorized";
                res.status(response.status.code).json(response);
            } else {
                let response=new Response();
                response.status.code = "500";
                response.status.message = err;
                res.status(500).json(response);
            }
        })
    } catch (err) {
        console.log("Error", err);
        let response=new Response();
        response.status.code = "500";
        response.status.message = err;
        res.status(500).json(response);
    }
}
function uploadVCF(req, res) {
    try {
        var response = new Response();
        var fileDetails = req.body;
        console.log("Controller Input for upload vcf", fileDetails);
        vcfService.uploadVCF(fileDetails).then(function (data) {
            response.status.statusCode = '200';
            response.result=data;
            response.status.message = "VCF Uploaded Successfully!!";
            res.status(200).json(response);
        }).catch(function (err) {
            logger.error(`Error Occured: ${err}`);
            if (err.code == 401) {
                let response=new Response();
                response.status.code = "401";
                response.status.message = "Unauthorized";
                res.status(response.status.code).json(response);
            } else {
                let response=new Response();
                response.status.code = "500";
                response.status.message = err;
                res.status(500).json(response);
            }
        })
    } catch (err) {
        console.log("Error", err);
        let response=new Response();
        response.status.code = "500";
        response.status.message = err;
        res.status(500).json(response);
    }
}


function getAllVariants(req, res) {
    try {
        let input=req.body;
        var response = new Response();
        vcfService.getAllVariants(input).then(function (result) {
            response.status.statusCode = '200';
            response.result=result;
            response.status.message = "All Variants Fetched Successfully!!";
            res.status(200).json(response);
        }).catch(function (err) {
            logger.error(`Error Occured: ${err}`);
            if (err.code == 401) {
                let response = new Response();
                response.status.code = "401";
                response.status.message = "Unauthorized";
                res.status(response.status.code).json(response);
            } else {
                let response = new Response();
                response.status.code = "500";
                response.status.message = err;
                res.status(500).json(response);
            }
        })
    } catch (err) {
        console.log("Error", err);
        let response = new Response();
        response.status.code = "500";
        response.status.message = err;
        res.status(500).json(response);
    }
}

function getSingleVariant(req, res) {
    try {
        let input=req.body;
        var response = new Response();
        vcfService.getSingleVariant(input).then(function (result) {
            response.status.statusCode = '200';
            response.result=result;
            response.status.message = "Variant Fetched Successfully!!";
            res.status(200).json(response);
        }).catch(function (err) {
            logger.error(`Error Occured: ${err}`);
            if (err.code == 401) {
                let response = new Response();
                response.status.code = "401";
                response.status.message = "Unauthorized";
                res.status(response.status.code).json(response);
            } else {
                let response = new Response();
                response.status.code = "500";
                response.status.message = err;
                res.status(500).json(response);
            }
        })
    } catch (err) {
        console.log("Error", err);
        let response = new Response();
        response.status.code = "500";
        response.status.message = err;
        res.status(500).json(response);
    }
}

function getMetaData(req, res) {
    try {
        let input=req.body;
        var response = new Response();
        vcfService.getMetaData(input).then(function (result) {
            response.status.statusCode = '200';
            response.result=result;
            response.status.message = "MetaData Fetched Successfully!!";
            res.status(200).json(response);
        }).catch(function (err) {
            logger.error(`Error Occured: ${err}`);
            if (err.code == 401) {
                let response = new Response();
                response.status.code = "401";
                response.status.message = "Unauthorized";
                res.status(response.status.code).json(response);
            } else {
                let response = new Response();
                response.status.code = "500";
                response.status.message = err;
                res.status(500).json(response);
            }
        })
    } catch (err) {
        console.log("Error", err);
        let response = new Response();
        response.status.code = "500";
        response.status.message = err;
        res.status(500).json(response);
    }
}

function getAllMetaData(req, res) {
    try {
        var response = new Response();
        vcfService.getAllMetaData().then(function (result) {
            response.status.statusCode = '200';
            response.result=result;
            response.status.message = "All MetaData Fetched Successfully!!";
            res.status(200).json(response);
        }).catch(function (err) {
            logger.error(`Error Occured: ${err}`);
            if (err.code == 401) {
                let response = new Response();
                response.status.code = "401";
                response.status.message = "Unauthorized";
                res.status(response.status.code).json(response);
            } else {
                let response = new Response();
                response.status.code = "500";
                response.status.message = err;
                res.status(500).json(response);
            }
        })
    } catch (err) {
        console.log("Error", err);
        let response = new Response();
        response.status.code = "500";
        response.status.message = err;
        res.status(500).json(response);
    }
}


//brapi/v2/search/variantsets
function searchVariantSets(req, res) {
    try {
        let input=req.body;
        vcfService.searchVariantSets(input).then(function (response) {
            response.status.statusCode = '200';
            response.status.message = "Variant Sets Fetched Successfully!!";
            res.status(200).json(response);
        }).catch(function (err) {
            logger.error(`Error Occured: ${err}`);
            if (err.code == 401) {
                let response = new Response();
                response.status.code = "401";
                response.status.message = "Unauthorized";
                res.status(response.status.code).json(response);
            } else {
                let response = new Response();
                response.status.code = "500";
                response.status.message = err;
                res.status(500).json(response);
            }
        })
    } catch (err) {
        console.log("Error", err);
        let response = new Response();
        response.status.code = "500";
        response.status.message = err;
        res.status(500).json(response);
    }
}

//brapi/v2/search/references
function searchReferences(req, res) {
    try {
        let input=req.body;
        vcfService.searchReferences(input).then(function (response) {
            response.status.statusCode = '200';
            response.status.message = "References Fetched Successfully!!";
            res.status(200).json(response);
        }).catch(function (err) {
            logger.error(`Error Occured: ${err}`);
            if (err.code == 401) {
                let response = new Response();
                response.status.code = "401";
                response.status.message = "Unauthorized";
                res.status(response.status.code).json(response);
            } else {
                let response = new Response();
                response.status.code = "500";
                response.status.message = err;
                res.status(500).json(response);
            }
        })
    } catch (err) {
        console.log("Error", err);
        let response = new Response();
        response.status.code = "500";
        response.status.message = err;
        res.status(500).json(response);
    }
}

//brapi/v2/search/samples
function searchSamples(req, res) {
    try {
        let input=req.body;
        vcfService.searchSamples(input).then(function (response) {
            response.status.statusCode = '200';
            response.status.message = "Samples Fetched Successfully!!";
            res.status(200).json(response);
        }).catch(function (err) {
            logger.error(`Error Occured: ${err}`);
            if (err.code == 401) {
                let response = new Response();
                response.status.code = "401";
                response.status.message = "Unauthorized";
                res.status(response.status.code).json(response);
            } else {
                let response = new Response();
                response.status.code = "500";
                response.status.message = err;
                res.status(500).json(response);
            }
        })
    } catch (err) {
        console.log("Error", err);
        let response = new Response();
        response.status.code = "500";
        response.status.message = err;
        res.status(500).json(response);
    }
}

//brapi/v2/search/allelematrix
function searchAlleleMatrix(req, res) {
    try {
        let input=req.body;
        vcfService.searchAlleleMatrix(input).then(function (response) {
            response.status.statusCode = '200';
            response.status.message = "Allele Matrix Fetched Successfully!!";
            res.status(200).json(response);
        }).catch(function (err) {
            logger.error(`Error Occured: ${err}`);
            if (err.code == 401) {
                let response = new Response();
                response.status.code = "401";
                response.status.message = "Unauthorized";
                res.status(response.status.code).json(response);
            } else {
                let response = new Response();
                response.status.code = "500";
                response.status.message = err;
                res.status(500).json(response);
            }
        })
    } catch (err) {
        console.log("Error", err);
        let response = new Response();
        response.status.code = "500";
        response.status.message = err;
        res.status(500).json(response);
    }
}
module.exports = vcfController;