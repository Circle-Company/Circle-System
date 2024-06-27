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
const find_most_famous_engine_1 = require("../../../../../src/find_most_famous_engine");
const find_top_followeds_1 = require("../../../../../src/find_most_famous_engine/src/find_top_followeds");
const increment_users_informations_1 = require("../../../../../src/find_most_famous_engine/src/increment_users_informations");
jest.mock('../../../../../src/find_most_famous_engine/src/find_top_followeds', () => ({
    FindTopFolloweds: jest.fn(),
}));
jest.mock('../../../../../src/find_most_famous_engine/src/increment_users_informations', () => ({
    IncrementUsersInformations: jest.fn(),
}));
describe('FindMostFamousEngine', () => {
    it('should return top users with information', () => __awaiter(void 0, void 0, void 0, function* () {
        // Mock the data returned by FindTopFolloweds and IncrementUsersInformations
        const findTopFollowedsResult = {
            topUsers: [
                {
                    id: 1,
                    username: 'testuser',
                    verifyed: false,
                    profile_picture: {
                        tiny_resolution: 'https://example.com/image.jpg',
                    },
                    statistic: {
                        total_followers_num: 1,
                    },
                },
            ],
            totalPages: 1,
            currentPage: 1,
            pageSize: 4
        };
        const incrementUsersInformationsResult = {
            topUsers: [
                {
                    id: 1,
                    username: 'testuser',
                    verifyed: false,
                    profile_picture: {
                        tiny_resolution: 'https://example.com/image.jpg',
                    },
                    statistic: {
                        total_followers_num: 1,
                    },
                },
            ],
            totalPages: 1,
            currentPage: 1,
            pageSize: 4
        };
        // Mock the implementation of FindTopFolloweds
        find_top_followeds_1.FindTopFolloweds.mockResolvedValue(findTopFollowedsResult);
        // Mock the implementation of IncrementUsersInformations
        increment_users_informations_1.IncrementUsersInformations.mockResolvedValue(incrementUsersInformationsResult);
        // Call the function being tested
        const result = yield (0, find_most_famous_engine_1.FindMostFamousEngine)({
            page: 1,
            pageSize: 4,
        }); // Adicione 'as FindMostFamousEngineProps' para resolver o erro
        // Expectations
        expect(find_top_followeds_1.FindTopFolloweds).toHaveBeenCalledWith({ page: 1, pageSize: 4 });
        expect(increment_users_informations_1.IncrementUsersInformations).toHaveBeenCalledWith(findTopFollowedsResult);
        expect(result).toEqual(incrementUsersInformationsResult);
        result.topUsers.forEach((user) => {
            expect(user.statistic.total_followers_num).toBeGreaterThan(0);
        });
    }));
});
