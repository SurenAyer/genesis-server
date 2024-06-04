module.exports = {
    fields:{
        databaseName : {
            type: "text"
        },
        projectId    : {
            type: "text"
        },
        studyDbId : {
            type: "text"
        },
        referenceName : {
            type: "text"
        },
        metaInfo : {
            type: "text"
        },
        availableFormats : {
            type: "list",
            typeDef: "<text>"
        },
        variantCount : {
            type: "int"
        },
        callSetCount : {
            type: "int"
        },
    },
    key:["studyDbId","referenceName"]
}