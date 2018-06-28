pragma solidity ^0.4.24;

import "./DroneMadnessToken.sol";
import "./zeppelin/lifecycle/Pausable.sol";
import "./zeppelin/crowdsale/emission/MintedCrowdsale.sol";
import "./zeppelin/crowdsale/validation/WhitelistedCrowdsale.sol";
import "./zeppelin/crowdsale/validation/TimedCrowdsale.sol";
import "./zeppelin/crowdsale/validation/CappedCrowdsale.sol";
/**
 * @title Drone Madness Presale Contract
 * @dev Drone Madness Presale Contract ...
 *
 * Add details ...
 */
contract DroneMadnessPresale is 
    MintedCrowdsale,
    CappedCrowdsale,
    TimedCrowdsale,
    WhitelistedCrowdsale {
    using SafeMath for uint256;

    // Min investment
    uint256 public minimalInvestmentInWei = 0.05 ether;
    
    mapping (address => uint256) internal invested;

    // Events for this contract

    /**
     * Event triggered when changing the current rate on different stages
     * @param rate new rate
     * @param cap new cap
     * @param minimalInvestmentInWei new minimalInvestmentInWei
     */
    event CurrentRateChange(uint256 rate, uint256 cap, uint256 minimalInvestmentInWei);

    /**
     * @dev Contract constructor
     * @param _cap uint256 hard cap of the crowdsale
     * @param _openingTime uint256 crowdsale start date/time
     * @param _closingTime uint256 crowdsale end date/time
     * @param _rate uint256 initial rate DRNMD for 1 ETH
     * @param _wallet address address where the collected funds will be transferred
     * @param _token DroneMadnessToken our token
     */
    constructor(
        uint256 _cap, 
        uint256 _openingTime, 
        uint256 _closingTime, 
        uint256 _rate, 
        address _wallet, 
        DroneMadnessToken _token) 
        Crowdsale(_rate, _wallet, _token)
        CappedCrowdsale(_cap)
        TimedCrowdsale(_openingTime, _closingTime) public {
    }

    /**
    * @dev Extend parent behavior requiring purchase to respect the funding cap.
    * @param _beneficiary Token purchaser
    * @param _weiAmount Amount of wei contributed
    */
    function _preValidatePurchase(address _beneficiary, uint256 _weiAmount) internal {
        super._preValidatePurchase(_beneficiary, _weiAmount);
        require(_weiAmount >= minimalInvestmentInWei);
    }

    function setRate(uint256 _rateInWei, uint256 _cap, uint256 _minimalInvestmentInWei) public onlyOwner returns (bool) { 
        require(openingTime > block.timestamp);
        require(_rateInWei > 0);
        require(_cap > 0);
        require(_minimalInvestmentInWei > 0);

        rate = _rateInWei;
        cap = _cap;
        minimalInvestmentInWei = _minimalInvestmentInWei;

        emit CurrentRateChange(rate, cap, minimalInvestmentInWei);
        return true;
    }

    function resetTokenOwnership() onlyOwner public { 
        Ownable(token).transferOwnership(owner);
    }
}
