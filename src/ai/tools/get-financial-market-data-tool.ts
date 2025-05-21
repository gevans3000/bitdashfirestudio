
'use server';
/**
 * @fileOverview A Genkit tool to fetch DXY and 10-Year U.S. Treasury Yield.
 * This tool is intended to simulate a call to a Google Cloud Function,
 * which would then fetch data from the FMP API.
 *
 * - getFinancialMarketDataTool - The Genkit tool definition.
 * - GetFinancialMarketDataOutputSchema - The Zod schema for the tool's output.
 * - GetFinancialMarketDataOutput - The TypeScript type for the tool's output.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Input schema for the tool
const GetFinancialMarketDataInputSchema = z.object({}).describe("Input for fetching financial market data. Currently accepts no parameters as the data fetched (DXY and UST10Y) is fixed by the underlying service.");

// Output schema based on the user's provided JSON structure
export const GetFinancialMarketDataOutputSchema = z.object({
  DXY: z.object({
    value: z.number().describe('The value of the DXY index.'),
    date: z.string().describe('The date of the DXY value, in YYYY-MM-DD format.'),
  }).describe('Data for the U.S. Dollar Index (DXY).'),
  UST10Y: z.object({
    value: z.number().describe('The value of the 10-Year U.S. Treasury Yield (as a percentage, e.g., 4.35 for 4.35%).'),
    date: z.string().describe('The date of the UST10Y value, in YYYY-MM-DD format.'),
  }).describe('Data for the 10-Year U.S. Treasury Yield.'),
});

export type GetFinancialMarketDataOutput = z.infer<typeof GetFinancialMarketDataOutputSchema>;

// Define the Genkit tool
export const getFinancialMarketDataTool = ai.defineTool(
  {
    name: 'getFinancialMarketData',
    description: 'Fetches the latest DXY (U.S. Dollar Index) and 10-Year U.S. Treasury Yield.',
    inputSchema: GetFinancialMarketDataInputSchema,
    outputSchema: GetFinancialMarketDataOutputSchema,
  },
  async () => {
    // In a real scenario, this function would call the specified Google Cloud Function.
    // For this agent's configuration, we return mock data conforming to the output schema.
    const currentDate = new Date().toISOString().split('T')[0];
    return {
      DXY: {
        value: 104.50, // Mock value
        date: currentDate,
      },
      UST10Y: {
        value: 4.35, // Mock value
        date: currentDate,
      },
    };
  }
);
