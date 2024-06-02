const { json } = require("body-parser");

module.exports = {
    fields:{
        studyDbId : "text",
        databaseName : "text",
        projectId : "text",
        CHROM    : "text",
        POS: "int",
        ALT : {
            type: "list",
            typeDef: "<text>"
        },
        INFO:{
            type: "text"
        },
        REF: "text",
        FILTER: "text",
        ID: {
                type: "list",
                typeDef: "<text>"
            },
        QUAL: "float",
        SAMPLES: {
            type: "map",
            typeDef: "<text, text>"
        }
    },
    key:["CHROM","POS","databaseName","projectId"]
}