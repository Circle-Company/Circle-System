import { describe, expect, it } from "vitest";
import { getEngagementEmbedding } from "../engagement"; // Correct the path to where your function is

describe("getEngagementEmbedding", () => {
    it("should correctly calculate the engagement embedding based on statistics and metadata", () => {
        // Defining example data for the test
        const exampleData = {
            statistics: {
                likes: 1200,
                shares: 300,
                clicksIntoMoment: 200,
                watchTime: 500000, // milliseconds
                clicksProfile: 80,
                comments: 150,
                views: 5000,
                skips: 20,
                showLessOften: 2,
                report: 1,
            },
            metadata: {
                totalDuration: 600000, // milliseconds (10 minutes or 600 seconds)
                createdAt: "2024-09-28T12:00:00Z",
            },
        };

        // Call the function we want to test
        const result = getEngagementEmbedding(exampleData);

        // Define the expected values for the embedding
        const expectedEmbedding = [
            Math.log1p(1200), // normalizedLikes
            Math.log1p(300), // normalizedShares
            Math.log1p(200), // normalizedClicksIntoMoment
            500000 / 600000, // normalizedWatchTime
            Math.log1p(80), // normalizedClicksProfile
            Math.log1p(150), // normalizedComments
            Math.log1p(5000), // normalizedViews
            Math.log1p(20), // normalizedSkips
            Math.log1p(2), // normalizedShowLessOften
            Math.log1p(1), // normalizedReports
        ];

        // Check if the result matches the expected embedding
        expect(result).toEqual(expectedEmbedding);
    });

    it("should return 0 for normalizedWatchTime when totalDuration is 0", () => {
        const exampleData = {
            statistics: {
                likes: 500,
                shares: 100,
                clicksIntoMoment: 50,
                watchTime: 100000, // milliseconds
                clicksProfile: 25,
                comments: 70,
                views: 2500,
                skips: 10,
                showLessOften: 1,
                report: 0,
            },
            metadata: {
                totalDuration: 0, // Total duration zero
                createdAt: "2024-09-28T12:00:00Z",
            },
        };

        // Call the function we want to test
        const result = getEngagementEmbedding(exampleData);

        // Verify if normalizedWatchTime is 0
        expect(result[3]).toBe(0); // Index 3 is normalizedWatchTime
    });

    it("should handle cases where statistics are null or absent", () => {
        const exampleData = {
            statistics: {
                likes: 0,
                shares: 0,
                clicksIntoMoment: 0,
                watchTime: 0,
                clicksProfile: 0,
                comments: 0,
                views: 0,
                skips: 0,
                showLessOften: 0,
                report: 0,
            },
            metadata: {
                totalDuration: 600000, // milliseconds
                createdAt: "2024-09-28T12:00:00Z",
            },
        };

        // Call the function we want to test
        const result = getEngagementEmbedding(exampleData);

        // Define the expected values for the embedding
        const expectedEmbedding = [
            Math.log1p(0), // normalizedLikes
            Math.log1p(0), // normalizedShares
            Math.log1p(0), // normalizedClicksIntoMoment
            0 / 600000, // normalizedWatchTime
            Math.log1p(0), // normalizedClicksProfile
            Math.log1p(0), // normalizedComments
            Math.log1p(0), // normalizedViews
            Math.log1p(0), // normalizedSkips
            Math.log1p(0), // normalizedShowLessOften
            Math.log1p(0), // normalizedReports
        ];

        // Check if the result matches the expected embedding
        expect(result).toEqual(expectedEmbedding);
    });
});
