var SafeMath = artifacts.require("./zeppelin/math/SafeMath.sol");
var DroneMadnessToken = artifacts.require("./DroneMadnessToken.sol");
var DroneMadnessCrowdsale = artifacts.require("./DroneMadnessCrowdsale.sol");

module.exports = function(deployer, network, accounts) {

    let settings = require('../tokenSettings.json');
    
    deployer.deploy(SafeMath);
    deployer.link(SafeMath, [DroneMadnessToken, DroneMadnessCrowdsale]);
    deployer
        .deploy(DroneMadnessToken, settings.maxTokenSupply)
        .then(() => {
            return deployer.deploy(DroneMadnessCrowdsale, 
                settings.crowdsaleCap, 
                settings.crowdsaleGoal, 
                settings.crowdsaleOpeningTime, 
                settings.crowdsaleClosingTime, 
                settings.crowdsaleRate, 
                settings.fundWallet, 
                DroneMadnessToken.address);
        });
};