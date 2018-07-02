const assertThrows = require("./utils/assertThrows.js");
const timeTravel = require("./utils/timeTravel.js");
const TokenPool = artifacts.require('./TokenPool.sol')
const DroneMadnessToken = artifacts.require('./DroneMadnessToken.sol')
const DroneMadnessCrowdsale = artifacts.require('./DroneMadnessCrowdsale.sol')

let settings = require('../tokenSettings.json');

contract('DroneMadnessCrowdsale', function(accounts) {

    const [
        owner,
        user1,
        user2,
        whitelistedUser,
        notlistedUser,
        advisor1,
        advisor2,
        airdrop1,
        airdrop2
    ] = accounts;

    let token;
    let sale;
    let currentTime = Math.floor(Date.now() / 1000);
    
    describe("Deployment", function() {

        it ('should be possible to create a new Crowdsale contract', async() => { 

            token = await DroneMadnessToken.new(settings.maxTokenSupply);
            assert.isNotNull(token);

            sale = await DroneMadnessCrowdsale.new(
                settings.crowdsaleCap, 
                settings.crowdsaleGoal, 
                settings.crowdsaleOpeningTime, 
                settings.crowdsaleClosingTime, 
                settings.crowdsaleRate, 
                settings.crowdsaleMinInvestmentInWei,
                settings.crowdsaleMaxInvestmentInWei,
                settings.fundWallet, 
                token.address);
            assert.isNotNull(sale);

            // Transfer token ownership to the sale
            let tx = await token.transferOwnership(sale.address);
            let newOwner = await token.owner();
            assert.strictEqual('OwnershipTransferred', tx.logs[0].event);
            assert.strictEqual(newOwner, sale.address);

            // Perform initial distribution
            await sale.doInitialDistribution(
                settings.teamWallet,
                settings.prizePool,
                settings.reservePool
            );
        })
   })
    
    describe("Initial settings", function() {

        it ('should start on 1st of September 2018 (first block after) 00:00 GMT', async() => { 
            let openingTime = await sale.openingTime();
            assert.strictEqual(openingTime.toNumber(), settings.crowdsaleOpeningTime);
        })

        it ('should end on 31st of December 2018 (first block after) 23:59 GMT', async() => { 
            let closingTime = await sale.closingTime();
            assert.strictEqual(closingTime.toNumber(), settings.crowdsaleClosingTime);
        })
        
        it ('should have a softcap of ' + settings.crowdsaleGoal / (1e18) + ' ETH (' + settings.crowdsaleGoal + ' wei)', async() => { 
            let goal = await sale.goal();
            assert.strictEqual(goal.toNumber(), settings.crowdsaleGoal);
        })

        it ('should have a hardcap of ' + settings.crowdsaleCap / (1e18) + ' ETH (' + settings.crowdsaleCap + ' wei)', async() => { 
            let cap = await sale.cap();
            assert.strictEqual(cap.toNumber(), settings.crowdsaleCap);
        })

        it ('should have distributed the tokens properly', async() => { 
            let teamTokens = await sale.TEAM_TOKENS();
            let teamWallet = await sale.teamWallet();
            let teamBalance = await token.balanceOf(teamWallet);
            let expectedTeamBalance = settings.maxTokenSupply * teamTokens.toNumber() / 100;
            assert.strictEqual(expectedTeamBalance, teamBalance.toNumber());

            let prizeTokens = await sale.PRIZE_TOKENS();
            let prizeBalance = await token.balanceOf(settings.prizePool);
            let expectedPrizeBalance = settings.maxTokenSupply * prizeTokens.toNumber() / 100;
            assert.strictEqual(expectedPrizeBalance, prizeBalance.toNumber());

            let advisorTokens = await sale.ADVISOR_TOKENS();
            let advisorPool = await sale.advisorPool();
            let advisorBalance = await token.balanceOf(advisorPool);
            let expectedAdvisorBalance = settings.maxTokenSupply * advisorTokens.toNumber() / 100;
            assert.strictEqual(expectedAdvisorBalance, advisorBalance.toNumber());

            let airdropTokens = await sale.AIRDROP_TOKENS();
            let airdropPool = await sale.airdropPool();
            let airdropBalance = await token.balanceOf(airdropPool);
            let expectedAirdropBalance = settings.maxTokenSupply * airdropTokens.toNumber() / 100;
            assert.strictEqual(expectedAirdropBalance, airdropBalance.toNumber());

            let reserveTokens = await sale.RESERVE_TOKENS();
            let reservePool = await sale.reservePool();
            let reserveBalance = await token.balanceOf(reservePool);
            let expectedReserveBalance = settings.maxTokenSupply * reserveTokens.toNumber() / 100;
            assert.strictEqual(expectedReserveBalance, reserveBalance.toNumber());
        })
    })
    
    describe("State changes", function() {
        
        it ('should be possible to pause the crowdsale to disable purchases', async() => { 
            let pausedState = await sale.paused();
            assert.strictEqual(false, pausedState);

            let tx = await sale.pause();
            assert.strictEqual('Pause', tx.logs[0].event);
            
            pausedState = await sale.paused();
            assert.strictEqual(true, pausedState);
        })
        
        it ('should be possible to unpause the crowdsale to re-enable purchases', async() => { 
            let pausedState = await sale.paused();
            assert.strictEqual(true, pausedState);

            let tx = await sale.unpause();
            assert.strictEqual('Unpause', tx.logs[0].event);
            
            pausedState = await sale.paused();
            assert.strictEqual(false, pausedState);
        })
        
        it ('should be possible to update the rate prior to the crowdsale', async() => { 
            let currentRate = await sale.rate();

            let newRate = 1500;
            let newCap = 120e18;
            let tx = await sale.setRate(newRate, newCap);
            
            assert.strictEqual('InitialRateChange', tx.logs[0].event);
            assert.strictEqual(newRate, tx.logs[0].args.rate.toNumber());
            
            let updatedRate = await sale.rate();
            assert.strictEqual(newRate, updatedRate.toNumber());

            let updatedCap = await sale.cap();
            assert.strictEqual(newCap, updatedCap.toNumber());
        })
        
        it ('should NOT be possible to update the rate by anyone else but the owner', async() => { 
            
            let newRate = 1500;
            let newCap = 120e18;
            let currentRate = await sale.rate();
            await assertThrows(sale.setRate(newRate, newCap, {from: user1}));
            let reRate = await sale.rate();
            assert.strictEqual(currentRate.toNumber(), reRate.toNumber());
        })

        it ('should be possible to reset original rate', async() => { 
            
            let originalRate = settings.crowdsaleRate;
            let originalCap = settings.crowdsaleCap;
            await sale.setRate(originalRate, originalCap, {from: owner});
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

    describe("Airdrops and Allocations", function() { 

        it ('should be possible to allocate tokens to advisor', async() => { 
            let amount1 = web3.toWei(1000, 'ether');
            let amount2 = web3.toWei(2000, 'ether');
            await sale.allocateAdvisorTokens([advisor1, advisor2], [amount1, amount2]);
            let balance1 = await token.balanceOf(advisor1);
            let balance2 = await token.balanceOf(advisor2);

            assert.equal(balance1.toNumber(), amount1);
            assert.equal(balance2.toNumber(), amount2);

            let paused = await token.paused();
            assert.isTrue(paused);
        })

        it ('should be possible to airdrop tokens', async() => { 
            let amount = web3.toWei(100, 'ether');
            await sale.airdropTokens([airdrop1, airdrop2], amount);
            let balance1 = await token.balanceOf(airdrop1);
            let balance2 = await token.balanceOf(airdrop2);
            assert.equal(balance1.toNumber(), amount);
            assert.equal(balance2.toNumber(), amount);

            let paused = await token.paused();
            assert.isTrue(paused);
        })
    })
    
    describe("Funding", function() { 

        it ('should NOT be possible to purchase tokens before the crowdsale starts', async() => { 
            let amount = web3.toWei(1, 'ether');
            await assertThrows(sale.sendTransaction({value: amount, from: whitelistedUser, gas: 2000000}));
        })

        it ('should be possible whitelisted user to purchase tokens during crowdsale', async() => { 

            // Time travel to the crowdsale start
            let travelSeconds = settings.crowdsaleOpeningTime - currentTime;
            timeTravel(travelSeconds);
            currentTime += travelSeconds;

            let amount = web3.toWei(1, 'ether');
            let rate = (await sale.rate()).toNumber();
            let tokensAmount = amount * rate;

            let balanceBefore = (await token.balanceOf(whitelistedUser)).toNumber();
            await sale.sendTransaction({value: amount, from: whitelistedUser, gas: 2000000});
            let balanceAfter = (await token.balanceOf(whitelistedUser)).toNumber();
            assert.equal(balanceAfter, balanceBefore + tokensAmount);
        })

        it ('should NOT be possible NOT whitelisted user to purchase tokens during crowdsale', async() => { 
            let amount = web3.toWei(1, 'ether');
            await assertThrows(sale.sendTransaction({value: amount, from: notlistedUser, gas: 2000000}));
        })

        it ('should NOT be possible user to purchase tokens below the minimum', async() => { 
            let minInvestmentInWei = await sale.minInvestmentInWei();
            let amount = minInvestmentInWei.minus(1);
            await assertThrows(sale.sendTransaction({value: amount, from: whitelistedUser, gas: 2000000}));
        })

        it ('should NOT be possible user to purchase tokens above the maximum', async() => { 
            let maxInvestmentInWei = await sale.maxInvestmentInWei();
            let amount = maxInvestmentInWei.toNumber() + 1;
            await assertThrows(sale.sendTransaction({value: amount, from: whitelistedUser, gas: 2000000}));
        })

        it ('should be possible to reach the goal', async() => { 
            let weiRaised = (await sale.weiRaised()).toNumber();
            let goal = (await sale.goal()).toNumber();
            let amount = goal - weiRaised;
            let balance = web3.eth.getBalance(whitelistedUser);

            await sale.sendTransaction({value: amount, from: whitelistedUser, gas: 2000000});

            let goalReached = await sale.goalReached();
            assert.isTrue(goalReached);
            
        })
    })

    describe("Stages & Finalization", function() { 

        it ('should NOT be possible to call finalize if not an owner', async() => {
            await assertThrows(sale.finalize({from: user1}));
        })

        it ('should NOT be possible finalize before the closing date', async() => { 
            await assertThrows(sale.finalize({from: owner}));
        })

        it ('should update rates correctly in time', async() => { 
            let bonuses = [30,20,10,0];
            let stages = [
                1535760000, // 1st of Sep - 30rd of Sep -> 30% Bonus
                1538352000, // 1st of Oct - 31st of Oct -> 20% Bonus
                1541030400, // 1st of Nov - 30rd of Oct -> 10% Bonus
                1543622400  // 1st of Dec - 31st of Dec -> 0% Bonus
            ]; 

            let initialRate = (await sale.initialRate()).toNumber();

            for (let i = 0; i < stages.length; i ++) {
                let travelSeconds = stages[i] - currentTime;
                if (travelSeconds > 0) {
                    timeTravel(travelSeconds);
                    currentTime += travelSeconds;
                }
                let tx = await sale.updateRate();

                let currentRate = (await sale.rate()).toNumber();
                let expectedRate = initialRate + Math.round(initialRate * bonuses[i] / 100);

                assert.strictEqual('CurrentRateChange', tx.logs[0].event);
                assert.strictEqual(expectedRate, tx.logs[0].args.rate.toNumber());
                assert.strictEqual(currentRate, expectedRate);
            }
        })

        it ('should be possible to finalize after the closing date', async() => { 
            // Time travel to the crowdsale end
            let travelSeconds = settings.crowdsaleClosingTime - currentTime;
            timeTravel(travelSeconds);
            currentTime += travelSeconds;

            let ownerBalanceBefore = (await web3.eth.getBalance(settings.fundWallet)).toNumber();

            // Finalize
            await sale.finalize({from: owner});

            // Check if minting has finished
            let mintingFinished = await token.mintingFinished();
            assert.isTrue(mintingFinished);

            // Check if token is unpaused
            let paused = await token.paused();
            assert.isFalse(paused);

            // Check if the ownership is transferred back to the original owner
            let newOwner = await token.owner();
            assert.strictEqual(owner, newOwner);

            // Check if the funds are transferred from the RefundVault to the wallet
            let weiRaised = (await sale.weiRaised()).toNumber();
            let ownerBalanceAfter = (await web3.eth.getBalance(settings.fundWallet)).toNumber();
            assert.strictEqual(ownerBalanceAfter, ownerBalanceBefore + weiRaised);
        })
    })
})
