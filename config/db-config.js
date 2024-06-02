var models = require('express-cassandra');

module.exports = new Promise((resolve, reject) => {
    console.log("Connecting to Cassandra"+__dirname);
    models.setDirectory(__dirname + '/../app/models').bind(
        {
            clientOptions: {
                contactPoints: ['127.0.0.1'],
                localDataCenter: 'datacenter1',
                protocolOptions: { port: 9042 },
                keyspace: '1000G_Test_DB',
                queryOptions: {consistency: models.consistencies.one},
                socketOptions: { readTimeout: 90000 },
                pooling: {
                    maxRequestsPerConnection: 20000 // Increase this number
                }
            },
            ormOptions: {
                defaultReplicationStrategy : {
                    class: 'SimpleStrategy',
                    replication_factor: 2
                },
                migration: 'safe'
            }
        },
        function(err) {
            if(err) reject(err);
            else resolve(models);
        }
    );
});