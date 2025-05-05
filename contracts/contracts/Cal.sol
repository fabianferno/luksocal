// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract luksoCal {
    struct User {
        address payable wallet;
        uint256 price15;
        uint256 price30;
        bool exists;
    }

    mapping(string => User) public registeredUsers;

    event UserRegistered(string username, address wallet, uint256 price15, uint256 price30);
    event SlotBooked(string username, address bookedBy, uint256 duration, uint256 amountPaid);

    modifier userExists(string memory username) {
        require(registeredUsers[username].exists, "User not registered");
        _;
    }

    function registerUser(string calldata username, uint256 price15, uint256 price30) external {
        require(!registeredUsers[username].exists, "Username already taken");
        require(price15 > 0 && price30 > 0, "Prices must be greater than 0");

        registeredUsers[username] = User({
            wallet: payable(msg.sender),
            price15: price15,
            price30: price30,
            exists: true
        });

        emit UserRegistered(username, msg.sender, price15, price30);
    }

    function bookCall(string calldata username, uint8 duration) external payable userExists(username) {
        require(duration == 15 || duration == 30, "Only 15 or 30 minute slots allowed");

        User memory user = registeredUsers[username];
        uint256 requiredPayment = duration == 15 ? user.price15 : user.price30;
        require(msg.value == requiredPayment, "Incorrect payment amount");

        user.wallet.transfer(msg.value);
        emit SlotBooked(username, msg.sender, duration, msg.value);
    }

    function getUserDetails(string calldata username) external view returns (address, uint256, uint256) {
        User memory user = registeredUsers[username];
        return (user.wallet, user.price15, user.price30);
    }
}
