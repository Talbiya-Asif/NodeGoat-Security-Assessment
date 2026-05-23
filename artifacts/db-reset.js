#!/usr/bin/env nodejs

"use strict";

const { MongoClient } = require("mongodb");
const { db: dbUrl } = require("../config/config");
const bcrypt = require("bcrypt-nodejs");

const USERS_TO_INSERT = [
    {
        "_id": 1,
        "userName": "admin",
        "firstName": "Node Goat",
        "lastName": "Admin",
        "password": bcrypt.hashSync("Admin_123", bcrypt.genSaltSync()),
        "isAdmin": true
    }, {
        "_id": 2,
        "userName": "user1",
        "firstName": "John",
        "lastName": "Doe",
        "benefitStartDate": "2030-01-10",
        "password": bcrypt.hashSync("User1_123", bcrypt.genSaltSync())
    }, {
        "_id": 3,
        "userName": "user2",
        "firstName": "Will",
        "lastName": "Smith",
        "benefitStartDate": "2025-11-30",
        "password": bcrypt.hashSync("User2_123", bcrypt.genSaltSync())
    }
];

MongoClient.connect(dbUrl, (err, client) => {
    if (err) {
        console.log("ERROR: connect");
        console.log(JSON.stringify(err));
        process.exit(1);
    }
    console.log("Connected to the database");

    const db = client.db("nodegoat");

    const collectionNames = ["users", "allocations", "contributions", "memos", "counters"];

    console.log("Dropping existing collections...");
    const dropPromises = collectionNames.map(name =>
        db.collection(name).drop().catch(() => {})
    );

    Promise.all(dropPromises).then(async () => {
        const usersCol = db.collection("users");
        const allocationsCol = db.collection("allocations");
        const countersCol = db.collection("counters");

        await countersCol.insertOne({ _id: "userId", seq: 3 });
        console.log("Counter reset");

        const result = await usersCol.insertMany(USERS_TO_INSERT);
        console.log(`Inserted ${result.insertedCount} users`);

        const finalAllocations = USERS_TO_INSERT.map(user => {
            const stocks = Math.floor((Math.random() * 40) + 1);
            const funds = Math.floor((Math.random() * 40) + 1);
            return {
                userId: user._id,
                stocks,
                funds,
                bonds: 100 - (stocks + funds)
            };
        });

        await allocationsCol.insertMany(finalAllocations);
        console.log("Allocations inserted");
        console.log("Database reset performed successfully");
        client.close();
        process.exit(0);
    });
});