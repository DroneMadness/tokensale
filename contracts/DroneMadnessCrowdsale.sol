pragma solidity ^0.4.24;

import "./DroneMadnessToken.sol";
import "./zeppelin/lifecycle/Pausable.sol";
import "./zeppelin/crowdsale/emission/MintedCrowdsale.sol";
import "./zeppelin/crowdsale/validation/WhitelistedCrowdsale.sol";
import "./zeppelin/crowdsale/validation/TimedCrowdsale.sol";
import "./zeppelin/crowdsale/validation/CappedCrowdsale.sol";
import "./zeppelin/crowdsale/distribution/FinalizableCrowdsale.sol";
import "./zeppelin/crowdsale/distribution/RefundableCrowdsale.sol";

/**
 * @title Drone Madness Crowdsale Contract
 * @dev Drone Madness Crowdsale Contract ...
 *
 * Add details ...
 */
contract DroneMadnessCrowdsale is 
    MintedCrowdsale,
    CappedCrowdsale,
    TimedCrowdsale,
    FinalizableCrowdsale,
    WhitelistedCrowdsale, 
    RefundableCrowdsale,
    Pausable {
    using SafeMath for uint256;

    // Rate bonuses
    uint256 public initialRate;
    uint256[4] public bonuses = [30,20,10,0];
    uint256[4] public stages = [
        1535760000, // 1st of Sep - 30rd of Sep -> 30% Bonus
        1538352000, // 1st of Oct - 31st of Oct -> 20% Bonus
        1541030400, // 1st of Nov - 30rd of Oct -> 10% Bonus
        1543622400  // 1st of Dec - 31st of Dec -> 0% Bonus
    ]; 
    
    // Min investment
    uint256 public minInvestmentInWei;
    // Max individual investment
    uint256 public maxInvestmentInWei;
    
    mapping (address => uint256) internal invested;

    // Events for this contract

    /**
     * Event triggered when changing the initial rate
     * @param rate new rate
     * @param cap new cap
     */
    event InitialRateChange(uint256 rate, uint256 cap);

    /**
     * Event triggered when changing the current rate on different stages
     * @param rate new rate
     */
    event CurrentRateChange(uint256 rate);

    /**
     * Event triggered when sale dates changed
     * @param openingTime crowdsale start date/time
     * @param closingTime crowdsale end date/time
     */
    event InitialDateChange(uint256 openingTime, uint256 closingTime);

    /**
     * @dev Contract constructor
     * @param _cap uint256 hard cap of the crowdsale
     * @param _goal uint256 soft cap of the crowdsale
     * @param _openingTime uint256 crowdsale start date/time
     * @param _closingTime uint256 crowdsale end date/time
     * @param _rate uint256 initial rate DRNMD for 1 ETH
     * @param _wallet address address where the collected funds will be transferred
     * @param _token DroneMadnessToken our token
     */
    constructor(
        uint256 _cap, 
        uint256 _goal, 
        uint256 _openingTime, 
        uint256 _closingTime, 
        uint256 _rate, 
        uint256 _minInvestmentInWei,
        uint256 _maxInvestmentInWei,
        address _wallet, 
        DroneMadnessToken _token) 
        Crowdsale(_rate, _wallet, _token)
        CappedCrowdsale(_cap)
        TimedCrowdsale(_openingTime, _closingTime)
        RefundableCrowdsale(_goal) public {
        require(_goal <= _cap);
        initialRate = _rate;
        minInvestmentInWei = _minInvestmentInWei;
        maxInvestmentInWei = _maxInvestmentInWei;
    }

    function updateRate() external onlyOwner {
        uint256 i = stages.length;
        while (i-- > 0) {
            if (block.timestamp >= stages[i]) {
                rate = initialRate.add(initialRate.mul(bonuses[i]).div(100));
                emit CurrentRateChange(rate);
                break;
            }
        }
    }

    /**
    * @dev Extend parent behavior requiring purchase to respect the funding cap.
    * @param _beneficiary Token purchaser
    * @param _weiAmount Amount of wei contributed
    */
    function _preValidatePurchase(address _beneficiary, uint256 _weiAmount) internal {
        super._preValidatePurchase(_beneficiary, _weiAmount);
        require(_weiAmount >= minInvestmentInWei);
        require(invested[_beneficiary].add(_weiAmount) <= maxInvestmentInWei);
        require(!paused);
    }

    /**
    * @dev Override for extensions that require an internal state to check for validity (current user contributions, etc.)
    * @param _beneficiary Address receiving the tokens
    * @param _weiAmount Value in wei involved in the purchase
    */
    function _updatePurchasingState(address _beneficiary, uint256 _weiAmount) internal {
        super._updatePurchasingState(_beneficiary, _weiAmount);
        invested[_beneficiary] = invested[_beneficiary].add(_weiAmount);
    }

    function finalization() internal {
        DroneMadnessToken dmToken = DroneMadnessToken(token);
        dmToken.finishMinting();
        dmToken.unpause();
        super.finalization();
        resetTokenOwnership();
    }

    function setRate(uint256 _rateInWei, uint256 _cap) public onlyOwner returns (bool) { 
        require(openingTime > block.timestamp);
        require(_rateInWei > 0);
        require(_cap > 0);

        initialRate = _rateInWei;
        rate = _rateInWei;
        cap = _cap;

        emit InitialRateChange(rate, cap);
        return true;
    }

    function resetTokenOwnership() onlyOwner public { 
        Ownable(token).transferOwnership(owner);
    }
}
