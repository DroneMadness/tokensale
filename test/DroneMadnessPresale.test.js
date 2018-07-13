const assertThrows = require("./utils/assertThrows.js");
const timeTravel = require("./utils/timeTravel.js");
const DroneMadnessToken = artifacts.require('./DroneMadnessToken.sol')
const DroneMadnessPresale = artifacts.require('./DroneMadnessPresale.sol')

let settings = require('../tokenSettings.json');

contract('DroneMadnessPresale', function(accounts) {

    const [
        owner,
        user1,
        user2,
        whitelistedUser,
        notlistedUser,
    ] = accounts;

    let token;
    let sale;
    let currentTime = Math.floor(Date.now() / 1000);
    
    describe("Deployment", function() {

        it ('should be possible to create a new Presale contract', async() => { 

            token = await DroneMadnessToken.new(settings.maxTokenSupply);
            assert.isNotNull(token);

            sale = await DroneMadnessPresale.new(
                settings.presaleCap, 
                settings.presaleOpeningTime, 
                settings.presaleClosingTime, 
                settings.presaleRate, 
                settings.presaleMinInvestmentInWei,
                settings.fundWallet, 
                token.address);
            assert.isNotNull(sale);
        })
    })
    
    describe("Initial settings", function() {

        it ('should start on 1st of August 2018 (first block after) 00:00 GMT', async() => { 
            let openingTime = await sale.openingTime();
            assert.strictEqual(openingTime.toNumber(), settings.presaleOpeningTime);
        })

        it ('should end on 31st of August 2018 (first block after) 23:59 GMT', async() => { 
            let closingTime = await sale.closingTime();
            assert.strictEqual(closingTime.toNumber(), settings.presaleClosingTime);
        })
        
        it ('should have a hardcap of ' + settings.presaleCap / (1e18) + ' ETH (' + settings.presaleCap + ' wei)', async() => { 
            let cap = await sale.cap();
            assert.strictEqual(cap.toNumber(), settings.presaleCap);
        })

        it ('should have a minimum investment set correctly', async() => { 
            let minInvestmentInWei = await sale.minInvestmentInWei();
            assert.strictEqual(minInvestmentInWei.toNumber(), settings.presaleMinInvestmentInWei);
        })
    })
    
    describe("State changes", function() {

        it ('should be possible to transfer token ownership to this contract address', async() => { 
            
            let tx = await token.transferOwnership(sale.address);
            let newOwner = await token.owner();
            assert.strictEqual('OwnershipTransferred', tx.logs[0].event);
            assert.strictEqual(newOwner, sale.address);
        })        
    })

    describe("Whitelist", function() {

        it ('should be possible to add a single address to the whitelist', async() => { 
            let whitelisted = await sale.whitelist(whitelistedUser);
            assert.isFalse(whitelisted);
            await sale.addToWhitelist(whitelistedUser);
            whitelisted = await sale.whitelist(whitelistedUser);
            assert.isTrue(whitelisted);
        })
    
        it ('should be possible to add multiple addresses to the whitelist', async() => { 
            await sale.addManyToWhitelist([user1, user2]);
            let whitelisted1 = await sale.whitelist(user1);
            let whitelisted2 = await sale.whitelist(user2);
            assert.isTrue(whitelisted1 && whitelisted2);

        })
                
        it ('should NOT be possible to add addresses by anyone other than the owner', async() => { 
            await assertThrows(sale.addToWhitelist(notlistedUser, {from : user1}));
        })
        
        it ('should be possible to remove an address from the whitelist', async() => { 
            let whitelisted = await sale.whitelist(user1);
            assert.isTrue(whitelisted);
            await sale.removeFromWhitelist(user1);
            whitelisted = await sale.whitelist(user1);
            assert.isFalse(whitelisted);
        })                  
    })
    
    describe("Funding", function() { 

        it ('should NOT be possible to purchase tokens before the presale starts', async() => { 
            let amount = web3.toWei(1, 'ether');
            await assertThrows(sale.sendTransaction({value: amount, from: whitelistedUser, gas: 2000000}));
        })

        it ('should be possible whitelisted user to purchase tokens during presale', async() => { 

            // Time travel to the presale start
            let travelSeconds = settings.presaleOpeningTime - currentTime;
            timeTravel(travelSeconds);
            currentTime += travelSeconds;

            let minInvestment = (await sale.minInvestmentInWei()).toNumber();
            let amount = minInvestment;
            let rate = (await sale.rate()).toNumber();
            let tokensAmount = amount * rate;

            let walletBalanceBefore = web3.eth.getBalance(settings.fundWallet);

            let balanceBefore = (await token.balanceOf(whitelistedUser)).toNumber();
            await sale.sendTransaction({value: amount, from: whitelistedUser, gas: 2000000});
            let balanceAfter = (await token.balanceOf(whitelistedUser)).toNumber();
            assert.equal(balanceAfter, balanceBefore + tokensAmount);

            let walletBalanceAfter = web3.eth.getBalance(settings.fundWallet);
            assert.equal(walletBalanceAfter.toNumber(), walletBalanceBefore.toNumber() + amount);
        })

        it ('should NOT be possible NOT whitelisted user to purchase tokens during presale', async() => { 
            let amount = (await sale.minInvestmentInWei()).toNumber();
            await assertThrows(sale.sendTransaction({value: amount, from: notlistedUser, gas: 2000000}));
        })

        it ('should NOT be possible user to purchase tokens below the minimum', async() => { 
            let minInvestmentInWei = await sale.minInvestmentInWei();
            let amount = minInvestmentInWei.minus(1);
            await assertThrows(sale.sendTransaction({value: amount, from: whitelistedUser, gas: 2000000}));
        })

        it ('should NOT be possible to purchase after the presale ends', async() => { 
            // Time travel to the presale start
            let travelSeconds = settings.presaleClosingTime - currentTime;
            timeTravel(travelSeconds);
            currentTime += travelSeconds;

            let amount = web3.toWei(1, 'ether');
            await assertThrows(sale.sendTransaction({value: amount, from: whitelistedUser, gas: 2000000}));
        })
    })
})
