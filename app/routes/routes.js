var auth = require('../../utils/authentication');


function setUp(router, controllers) {
    //LOGIN
    router.post('/genesis/rest/login', controllers.loginController.login);
    
    //VCF
    
    router.post('/genesis/rest/vcf/metadata/process', auth.authenticate(), controllers.vcfController.processVCFMetaData);
    router.post('/genesis/rest/vcf/upload', auth.authenticate(), controllers.vcfController.uploadVCF);
    router.post('/genesis/rest/vcf/variants/all', auth.authenticate(), controllers.vcfController.getAllVariants);
    router.post('/genesis/rest/vcf/variants', auth.authenticate(), controllers.vcfController.getSingleVariant);
    router.post('/genesis/rest/vcf/metadata', auth.authenticate(), controllers.vcfController.getMetaData);
    router.get('/genesis/rest/vcf/metadata/all', auth.authenticate(), controllers.vcfController.getAllMetaData);
    
    //BRAPI
    router.post('/genesis/rest/brapi/v2/search/variantsets', auth.authenticate(), controllers.vcfController.searchVariantSets);
    router.post('/genesis/rest/brapi/v2/search/references', auth.authenticate(), controllers.vcfController.searchReferences);
    router.post('/genesis/rest/brapi/v2/search/samples', auth.authenticate(), controllers.vcfController.searchSamples);
    router.post('/genesis/rest/brapi/v2/search/allelematrix', auth.authenticate(), controllers.vcfController.searchAlleleMatrix);
    
    
}

module.exports.setUp = setUp;