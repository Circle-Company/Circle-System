"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const search_engine_1 = require("../../../../../src/search_engine"); // Update the path accordingly
const User = require('../../../../../src/models/user/user-model.js');
describe("SearchEngine Test", () => {
    it("should return a list of users with specified properties", async () => {
        // Create a mock user for testing
        const mockUser = {
            id: 9,
            username: "apple",
            name: null,
            verifyed: true,
            you_follow: false,
            statisitc: {
                total_followers_num: 0
            },
            profile_picture: {
                tiny_resolution: null,
            },
        };
        // Mock the input parameters for SearchEngine
        const searchParams = {
            user_id: 1,
            search_term: "apple",
        };
        // Call the SearchEngine function and wait for the result
        const searchResult = await (0, search_engine_1.SearchEngine)(searchParams);
        // Assert that the result is an array
        expect(Array.isArray(searchResult)).toBe(true);
        // Assert that each item in the result array has the specified properties
        searchResult.forEach((user) => {
            expect(user.id).toEqual(mockUser.id);
            expect(user.username).toEqual(mockUser.username);
            expect(user.name).toEqual(mockUser.name);
            expect(user.verifyed).toEqual(mockUser.verifyed);
            expect(user.profile_picture.tiny_resolution).toEqual(mockUser.profile_picture.tiny_resolution);
        });
    });
});
