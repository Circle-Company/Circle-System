"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const search_engine_1 = require("../../../../../src/search_engine"); // Update the path accordingly
const User = require('../../../../../src/models/user/user-model.js');
describe("SearchEngine Test", () => {
    it("should return a list of users with specified properties", () => __awaiter(void 0, void 0, void 0, function* () {
        // Create a mock user for testing
        const mockUser = {
            id: 1,
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
            search_term: "tiago.savioli",
        };
        // Call the SearchEngine function and wait for the result
        const searchResult = yield (0, search_engine_1.SearchEngine)(searchParams);
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
    }));
});
