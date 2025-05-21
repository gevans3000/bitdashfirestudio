
'use server';
/**
 * @fileOverview A Genkit flow to report DXY and 10-Year U.S. Treasury Yield
 * using a dedicated tool.
 *
 * - reportFinancialData - An async function to call the flow.
 * - ReportFinancialDataInput - The input type for the flow.
 * - ReportFinancialDataOutput - The output type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getFinancialMarketDataTool } from '@/ai/tools/get-financial-market-data-tool';

// Input schema for the flow
export const ReportFinancialDataInputSchema = z.object({
  query: z.string().describe('The user query, e.g., "What is the DXY?" or "Tell me the 10-year treasury yield."'),
});
export type ReportFinancialDataInput = z.infer<typeof ReportFinancialDataInputSchema>;

// Output schema for the flow
export const ReportFinancialDataOutputSchema = z.object({
  report: z.string().describe('A natural language report of the requested financial data, or an error/alternative message.'),
});
export type ReportFinancialDataOutput = z.infer<typeof ReportFinancialDataOutputSchema>;

// Define the exported function that calls the flow
export async function reportFinancialData(input: ReportFinancialDataInput): Promise<ReportFinancialDataOutput> {
  return reportFinancialDataFlow(input);
}

// Define the prompt
const financialDataPrompt = ai.definePrompt({
  name: 'financialDataReportPrompt',
  input: { schema: ReportFinancialDataInputSchema },
  output: { schema: ReportFinancialDataOutputSchema },
  tools: [getFinancialMarketDataTool],
  prompt: `You are a financial assistant. Based on the user's query: "{{{query}}}"

If the query is about DXY (U.S. Dollar Index) or the 10-Year U.S. Treasury Yield (or similar terms like "10 year bond yield"), you MUST use the 'getFinancialMarketData' tool to fetch the latest data.
Once you have the data from the tool (which includes DXY.value, DXY.date, UST10Y.value, UST10Y.date), formulate your response as:
"As of {DXY.date}, the DXY is {DXY.value}. As of {UST10Y.date}, the 10-Year U.S. Treasury Yield is {UST10Y.value}%." (Replace placeholders with actual values from the tool. Ensure the '%' sign is included for the yield.)

If the 'getFinancialMarketData' tool is used but (hypothetically) fails or does not provide the necessary data, respond with:
"I'm currently unable to retrieve that financial data. Please try again later."

If the user's query is not related to DXY or the 10-Year U.S. Treasury Yield, respond with:
"I can only provide information on DXY and 10-Year U.S. Treasury Yield at the moment."

Your final output should be structured as a JSON object with a single key "report", where the value is the formulated string.
`,
});

// Define the flow
const reportFinancialDataFlow = ai.defineFlow(
  {
    name: 'reportFinancialDataFlow',
    inputSchema: ReportFinancialDataInputSchema,
    outputSchema: ReportFinancialDataOutputSchema,
  },
  async (input) => {
    const llmResponse = await financialDataPrompt(input);
    const output = llmResponse.output;

    if (!output || typeof output.report !== 'string') {
        // Fallback if LLM fails to produce expected output
        return { report: "I encountered an issue processing your request for financial data. Please try again later." };
    }
    return output; // This should be { report: "..." }
  }
);
