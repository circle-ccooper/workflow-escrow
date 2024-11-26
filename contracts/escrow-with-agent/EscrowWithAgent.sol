// SPDX-License-Identifier: MIT
pragma solidity >=0.5.8 <0.9.0;

/// @title An escrow contract with a third-party agent for USDC
/// @notice This contract holds USDC tokens from a depositor and keeps it until the third-party agent decides to send the tokens to the beneficiary
interface USDC {
    function transfer(
        address recipient,
        uint256 amount
    ) external returns (bool);

    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external returns (bool);

    function balanceOf(address account) external view returns (uint256);
}

contract EscrowWithAgent {
    address public depositor;
    address public beneficiary;
    address public agent;
    uint256 public amount;
    USDC public usdcToken;
    Stages public currentStage;

    event deposited(uint256 amount, Stages currentStage);
    event released(uint256 amount, Stages currentStage);
    event reverted(uint256 amount, Stages currentStage);
    event stageChange(Stages currentStage);

    enum Stages {
        OPEN,
        LOCKED,
        CLOSED
    }

    // Constructor to initialize the contract
    constructor(
        address _depositor,
        address _beneficiary,
        address _agent,
        uint256 _amount,
        address _usdcTokenAddress
    ) {
        depositor = _depositor;
        beneficiary = _beneficiary;
        agent = _agent;
        amount = _amount;
        usdcToken = USDC(_usdcTokenAddress);
        currentStage = Stages.OPEN;
        emit stageChange(currentStage);
    }

    function deposit() public {
        require(msg.sender == depositor, "Sender must be the depositor");
        require(currentStage == Stages.OPEN, "Wrong stage");
        require(
            usdcToken.balanceOf(address(this)) <= amount,
            "Can't send more than specified amount"
        );

        usdcToken.transferFrom(depositor, address(this), amount);

        if (usdcToken.balanceOf(address(this)) >= amount) {
            currentStage = Stages.LOCKED;
            emit stageChange(currentStage);
        }
        emit deposited(amount, currentStage);
    }

    function release() public {
        require(msg.sender == agent, "Only agent can release funds");
        require(currentStage == Stages.LOCKED, "Funds not in escrow yet");
        usdcToken.transfer(beneficiary, amount);
        currentStage = Stages.CLOSED;
        emit stageChange(currentStage);
        emit released(amount, currentStage);
    }

    function revertEscrow() public {
        require(msg.sender == agent, "Only agent can revert the contract");
        require(
            currentStage == Stages.LOCKED || currentStage == Stages.OPEN,
            "Cannot revert at this stage"
        );
        usdcToken.transfer(depositor, amount);
        currentStage = Stages.CLOSED;
        emit stageChange(currentStage);
        emit reverted(amount, currentStage);
    }

    function stageOf() public view returns (Stages) {
        return currentStage;
    }

    function balanceOf() public view returns (uint256) {
        return usdcToken.balanceOf(address(this));
    }
}