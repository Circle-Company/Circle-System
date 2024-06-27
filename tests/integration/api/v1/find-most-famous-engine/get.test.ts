import { FindMostFamousEngine } from '../../../../../src/MFU';
import { FindTopFolloweds } from '../../../../../src/MFU/src/find_top_followeds';
import { IncrementUsersInformations } from '../../../../../src/MFU/src/increment_users_informations';
import { FindMostFamousEngineProps, TopUserIncrementedObjectProps} from '../../../../../src/MFU/types';

jest.mock('../../../../../src/find_most_famous_engine/src/find_top_followeds', () => ({
  FindTopFolloweds: jest.fn(),
}));

jest.mock('../../../../../src/find_most_famous_engine/src/increment_users_informations', () => ({
  IncrementUsersInformations: jest.fn(),
}));

describe('FindMostFamousEngine', () => {
  it('should return top users with information', async () => {
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
    (FindTopFolloweds as jest.MockedFunction<typeof FindTopFolloweds>).mockResolvedValue(findTopFollowedsResult);

    // Mock the implementation of IncrementUsersInformations
    (IncrementUsersInformations as jest.MockedFunction<typeof IncrementUsersInformations>).mockResolvedValue(incrementUsersInformationsResult);

    // Call the function being tested
    const result = await FindMostFamousEngine({
      page: 1,
      pageSize: 4,
    } as FindMostFamousEngineProps); // Adicione 'as FindMostFamousEngineProps' para resolver o erro

    // Expectations
    expect(FindTopFolloweds).toHaveBeenCalledWith({ page: 1, pageSize: 4 });
    expect(IncrementUsersInformations).toHaveBeenCalledWith(findTopFollowedsResult);
    expect(result).toEqual(incrementUsersInformationsResult);
    result.topUsers.forEach((user: any) => {
      expect(user.statistic.total_followers_num).toBeGreaterThan(0);
    });
  });
});