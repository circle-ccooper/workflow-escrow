/*
    
   ██████  ██████   ██████  ██   ██ ██████   ██████   ██████  ██   ██    ██████  ███████ ██    ██
  ██      ██    ██ ██    ██ ██  ██  ██   ██ ██    ██ ██    ██ ██  ██     ██   ██ ██      ██    ██
  ██      ██    ██ ██    ██ █████   ██████  ██    ██ ██    ██ █████      ██   ██ █████   ██    ██
  ██      ██    ██ ██    ██ ██  ██  ██   ██ ██    ██ ██    ██ ██  ██     ██   ██ ██       ██  ██
   ██████  ██████   ██████  ██   ██ ██████   ██████   ██████  ██   ██ ██ ██████  ███████   ████
  
  Find any smart contract, and build your project faster: https://www.cookbook.dev
  Twitter: https://twitter.com/cookbook_dev
  Discord: https://discord.gg/cookbookdev
  
  Find this contract on Cookbook: https://www.cookbook.dev/contracts/escrow-with-agent/?utm=code
  */
  
  // SPDX-License-Identifier: MIT
pragma solidity >=0.5.8 <0.9.0;

/// @title An escrow contract with a third-party agent
/// @author SD17
/// @notice this contract holds some ether from a depositor. Keeps it until the third-party agent desides to send the ether to the beneficiary
contract EscrowWithAgent {
    address payable public depositor; // payable: depositor address needs to transfer the ether to own addrss, if un-successful
    address payable public beneficiary; // payable: payees address needs to transfer the ether to own addrss, if successful
    address public agent;
    uint256 public amount;
    Stages public currentStage;

    // while checking for event's name in chai/truffleAssert
    // look for contractInstance.amount, contractInstance.currentStage
    // as amount, currentStage is the actual parameter name. Irrespective of the emit part
    event deposited(uint256 amount, Stages currentStage);
    event released(uint256 amount, Stages currentStage);
    event reverted(uint256 amount, Stages currentStage);
    event stageChange(Stages currentStage);

    // OPEN: escrow contract is open; the depositor hasn't paid yet
    // ONGOING: escrow contract is open; depositor has paid; beneficiary didn't receive the ether
    // CLOSED: beneficiary received the ether
    enum Stages {
        OPEN,
        ONGOING,
        CLOSED
    }


    // use this function instead of the constructor
    // since creation will be done using createClone() function
    function init (
        address payable _depositor,
        address payable _beneficiary,
        address _agent,
        uint256 _amount
    ) public  {
        depositor = _depositor;
        beneficiary = _beneficiary;
        agent = _agent; // agent needs to be sent by the factory, factory's msg.sender is agent
        amount = _amount; // the amount of real ether

        // the stage sets to OPEN
        currentStage = Stages.OPEN;
        emit stageChange(currentStage);
    }

    function deposit() public payable {
        require(msg.sender == depositor, "Sender must be the depositor");
        require(currentStage == Stages.OPEN, "Wrong stage, see current stage");
        require(
            address(this).balance <= amount,
            "Cant send more than specified amount"
        );

        // can be paid in multiple intervals.
        // each time checking if the full amount is given or not
        // if given then change the stage
        if (address(this).balance >= amount) {
            currentStage = Stages.ONGOING;
            emit stageChange(currentStage);
        }
        emit deposited(amount, currentStage);
    }

    function release() public {
        require(msg.sender == agent, "Only agent can release funds");
        require(currentStage == Stages.ONGOING);
        beneficiary.transfer(address(this).balance);
        currentStage = Stages.CLOSED;
        emit stageChange(currentStage);
        emit released(amount, currentStage);
    }

    function revertEscrow() public {
        require(msg.sender == agent, "Only agent can revert the contract");
        require(currentStage == Stages.ONGOING && currentStage == Stages.OPEN); // can only be reverted in these two stages
        depositor.transfer(amount);
        currentStage = Stages.CLOSED;
        emit stageChange(currentStage);
        emit reverted(amount, currentStage);
    }

    function stageOf() public view returns (Stages) {
        return currentStage;
    }

    function balanceOf() public view returns (uint256) {
        return address(this).balance;
    }
}
