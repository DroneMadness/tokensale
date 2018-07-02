var SafeMath = artifacts.require("./zeppelin/math/SafeMath.sol");
var DroneMadnessToken = artifacts.require("./DroneMadnessToken.sol");
var DroneMadnessPresale = artifacts.require("./DroneMadnessPresale.sol");
var DroneMadnessCrowdsale = artifacts.require("./DroneMadnessCrowdsale.sol");

module.exports = function(deployer, network, accounts) {

    let settings = require('../tokenSettings.json');
    let token;
    let sale;
    let presale;
    
    deployer.deploy(SafeMath);
    deployer.link(SafeMath, [DroneMadnessToken, DroneMadnessPresale, DroneMadnessCrowdsale]);
    deployer
        .deploy(DroneMadnessToken, settings.maxTokenSupply)
        .then((instance) => {
            token = instance;
            return deployer.deploy(DroneMadnessCrowdsale, 
                settings.crowdsaleCap, 
                settings.crowdsaleGoal, 
                settings.crowdsaleOpeningTime, 
                settings.crowdsaleClosingTime, 
                settings.crowdsaleRate, 
                settings.crowdsaleMinInvestmentInWei,
                settings.crowdsaleMaxInvestmentInWei,
                settings.fundWallet, 
                token.address);
        })
        .then((instance) => {
            sale = instance;
            return token.transferOwnership(sale.address);
        })
        .then(() => {
            return sale.doInitialDistribution(
                settings.teamWallet,
                settings.prizePool,
                settings.reservePool
            )
        })
        .then(() => {
            return deployer.deploy(DroneMadnessPresale, 
                settings.presaleCap, 
                settings.presaleOpeningTime, 
                settings.presaleClosingTime, 
                settings.presaleRate, 
                settings.crowdsaleMinInvestmentInWei,
                settings.fundWallet, 
                token.address);
        })
        .then((instance) => {
            presale = instance;
            return sale.transferTokenOwnership(presale.address);
        })
};