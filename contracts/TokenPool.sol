pragma solidity ^0.4.24;

import "./zeppelin/math/SafeMath.sol";
import "./zeppelin/ownership/Ownable.sol";
import "./zeppelin/token/ERC20/ERC20Basic.sol";
import "./zeppelin/token/ERC20/SafeERC20.sol";

/**
 * @title Drone Madness Token
 * @dev Drone Madness Token - Token code for the Drone Madness Project
 *
 * Add details ...
 */
contract TokenPool is Ownable {
    using SafeMath for uint256;
    using SafeERC20 for ERC20Basic;

    ERC20Basic public token;
    uint256 public cap;
    uint256 public totalAllocated;

    constructor(address _token, uint256 _cap) public {
        token = ERC20Basic(_token);
        cap = _cap;
        totalAllocated = 0;
    }

    function allocate(address[] _beneficiaries, uint256[] _amounts) public onlyOwner {
        for (uint256 i = 0; i < _beneficiaries.length; i ++) {
            require(totalAllocated.add(_amounts[i]) <= cap);
            token.safeTransfer(_beneficiaries[i], _amounts[i]);
            totalAllocated.add(_amounts[i]);
        }
    }

    function allocateEqual(address[] _beneficiaries, uint256 _amount) public onlyOwner {
        uint256 totalAmount = _amount.mul(_beneficiaries.length);
        require(totalAllocated.add(totalAmount) <= cap);
        require(token.balanceOf(this) >= totalAmount);

        for (uint256 i = 0; i < _beneficiaries.length; i ++) {
            token.safeTransfer(_beneficiaries[i], _amount);
            totalAllocated.add(_amount);
        }
    }
}