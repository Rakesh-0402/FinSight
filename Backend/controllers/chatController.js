import Groq from "groq-sdk";
import Transaction from "../models/Transaction.js";
import Chat from "../models/Chat.js";
import {
  redactFinancialText,
  sanitizeTransactionForAI,
} from "../utils/redactFinancialData.js";

import {
  buildQuerySpecificContext,
} from "../services/querySpecificContext.js";

// GROQ CLIENT
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});


// GENERATE CHAT TITLE

const generateChatTitle = async (question) => {
  try {
    const completion =
      await groq.chat.completions.create({
        model: "openai/gpt-oss-20b",

        messages: [
          {
            role: "user",
            content: `
Create a short title for this conversation.

Rules:
- 3 to 6 words only
- No quotes
- No punctuation at the end
- Make it descriptive
- Return ONLY the title

User question:
${question}
`,
          },
        ],
      });

    return (
      completion.choices[0]?.message?.content?.trim() ||
      "Financial Analysis"
    );
  } catch (error) {
    console.error(
      "Title generation failed:",
      error.message
    );

    return "Financial Analysis";
  }
};

// BUILD FINANCIAL CONTEXT

const buildFinancialContext = async (userId) => {
  const summaryData =
    await Transaction.aggregate([
      {
        $match : {
          user : userId,
        }
      },
      {
        $group: {
          _id: "$type",
          total: { $sum: "$amount"},
          count: { $sum: 1},
        },
      },
    ]);

  let income = 0;
  let expenses = 0;

  summaryData.forEach((item) => {
    if (item._id === "income") {
      income = item.total;
    }

    if (item._id === "expense") {
      expenses = item.total;
    }
  });


  // --------------------------------------------------
  // CATEGORY SPENDING
  // --------------------------------------------------

  const categorySpending =
    await Transaction.aggregate([
      {
        $match: {
          user : userId,
          type: "expense",
        },
      },
      {
        $group: {
          _id: "$category",

          amount: {
            $sum: "$amount",
          },

          count: {
            $sum: 1,
          },
        },
      },
      {
        $sort: {
          amount: -1,
        },
      },
      {
        $project: {
          _id: 0,
          category: "$_id",
          amount: 1,
          count: 1,
        },
      },
    ]);


  // --------------------------------------------------
  // MONTHLY DATA
  // --------------------------------------------------

  const monthlyData =
    await Transaction.aggregate([
      {
        $match: {
          user : userId,
          type: {
            $in: [
              "income",
              "expense",
            ],
          },
        },
      },
      {
        $group: {
          _id: {
            year: {
              $year: "$date",
            },

            month: {
              $month: "$date",
            },
          },

          income: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    "$type",
                    "income",
                  ],
                },
                "$amount",
                0,
              ],
            },
          },

          expenses: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    "$type",
                    "expense",
                  ],
                },
                "$amount",
                0,
              ],
            },
          },
        },
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
        },
      },
      {
        $project: {
          _id: 0,

          year:
            "$_id.year",

          month:
            "$_id.month",

          income: 1,

          expenses: 1,
        },
      },
    ]);


  // --------------------------------------------------
  // BIGGEST EXPENSES
  // --------------------------------------------------

  const biggestExpenses =
    await Transaction.find({
      user : userId,
      type: "expense",
    })
      .sort({
        amount: -1,
      })
      .limit(5)
      .select(
        "description amount category date"
      )
      .lean();


  // --------------------------------------------------
  // ANOMALIES
  // --------------------------------------------------

  const anomalies =
    await Transaction.find({
      user : userId,
      isAnomaly: true,
    })
      .sort({
        anomalyScore: -1,
      })
      .limit(10)
      .select(
        "description amount category date anomalyScore"
      )
      .lean();


  // --------------------------------------------------
  // RECENT TRANSACTIONS
  // --------------------------------------------------

  const recentTransactions =
    await Transaction.find({
      user : userId,
    })
      .sort({
        date: -1,
        createdAt: -1,
      })
      .limit(20)
      .select(
        "description amount type category date"
      )
      .lean();


  return {
    summary: {
      income,
      expenses,
      balance:
        income - expenses,
    },

    categorySpending,

    monthlyData,

    biggestExpenses,

    anomalies,

    recentTransactions,
  };
};


// --------------------------------------------------
// ASK FINANCIAL ASSISTANT
// --------------------------------------------------

export const askFinancialAssistant = async (req,res) => {
  const userId = req.user._id;

  try {
    const {question , chatId} = req.body;

    if (!question?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Question is required",
      });
    }

    let chat;


    
    // LOAD EXISTING CHAT
  
    if (chatId) {
      chat = await Chat.findOne({
        _id : chatId,
        user : userId,
      });
    }

    // CREATE NEW CHAT

    if (!chat) {
      const title = await generateChatTitle(redactFinancialText(question));

      chat = await Chat.create({
        user : userId,
        title,
        messages: [],
      });
    }

    // FINANCIAL CONTEXT

    const context = await buildFinancialContext(userId);

    const querySpecificContext = await buildQuerySpecificContext(userId,question);

    //sanitize the context before sending it to groq
    const safeContext = {
      summary: context.summary,

      categorySpending:
        context.categorySpending,

      monthlyData:
        context.monthlyData,

      biggestExpenses:
        context.biggestExpenses.map(
          sanitizeTransactionForAI
        ),

      anomalies:
        context.anomalies.map(
          sanitizeTransactionForAI
        ),

      recentTransactions:
        context.recentTransactions.map(
          sanitizeTransactionForAI
        ),
       querySpecific:
        querySpecificContext
          ? {
              ...querySpecificContext,

              transactions:
                querySpecificContext.transactions?.map(
                  sanitizeTransactionForAI
                ),
            }
          : null,
        };

    // RECENT CHAT HISTORY
  
    const conversationHistory =
      chat.messages
        .slice(-10)
        .map(
          (message) =>
            `${message.role}: ${redactFinancialText(
              message.text
            )}`
        )
        .join("\n");


    // --------------------------------------------------
    // SYSTEM / USER PROMPT
    // --------------------------------------------------
const systemPrompt = `
You are FinSight, an intelligent and conversational personal financial assistant.

Your job is to help the user understand their financial data clearly, naturally, and accurately.

Your responses should feel like a thoughtful financial conversation, not like a database report.

The user may ask about:
- spending
- income
- balances
- categories
- transactions
- anomalies
- monthly behaviour
- multi-month trends
- year-over-year or month-over-month changes
- largest expenses
- recurring patterns
- financial summaries
- general financial questions
- follow-up questions about previous answers

For questions about the user's own finances, use ONLY the financial data provided below.

Never invent missing financial information.

==================================================
CORE ACCURACY RULES
==================================================

- Never invent transactions, amounts, categories, balances, dates, trends, anomalies, or financial events.
- Never assume missing months contain zero activity unless the provided financial data explicitly shows zero.
- If the requested period is not available, clearly say which data is available instead.
- If there is not enough data to answer accurately, say so briefly.
- Use Indian Rupees (₹).
- Format Indian currency naturally using Indian digit grouping when possible.
- An anomaly means unusual financial behaviour, not necessarily fraud.
- Never describe anomaly scores as fraud probabilities.
- Forecasts are estimates, not guarantees.
- Do not promise guaranteed financial outcomes.
- Distinguish observed financial facts from general suggestions.
- Do not speculate about why the user personally spent money unless the transaction data supports the explanation.
- When explaining "why" spending changed, identify the transactions, categories, or months that contributed to the change.

==================================================
DEFAULT RESPONSE STYLE
==================================================

Write like a helpful conversational financial assistant.

Do NOT respond like a raw analytics dashboard or database export.

By default:

- Start directly with the answer.
- Use short natural paragraphs.
- Use bullets when they make information easier to scan.
- Use numbered points when explaining a sequence, several months, or several findings.
- Use bold selectively for important amounts, months, categories, or changes.
- Keep the response concise but informative.
- Provide enough explanation to make the numbers meaningful.
- Avoid repeating the same numbers in multiple sections.
- Avoid unnecessary headings.
- Do not create too many sections for a simple question.
- Do not end every answer with a generic "Key Takeaway" section.
- Add a short concluding observation only when it adds useful information.

==================================================
TABLE RULES
==================================================

DO NOT use tables by default.

Only use a Markdown table when the user explicitly asks for:
- a table
- tabular format
- spreadsheet-style comparison

For all normal comparisons, summaries, month-to-month analysis, category analysis, and trend explanations, use conversational paragraphs and bullet points instead.

Even when comparing many months, prefer:

- Month — amount — what changed
- concise bullet-by-bullet explanations

instead of a table.

==================================================
MONTH-BY-MONTH ANALYSIS
==================================================

When the user asks questions such as:

- "What changed in the last 7 months?"
- "Explain my spending month by month"
- "How has my spending changed this year?"
- "Compare the last 6 months"

give a chronological month-by-month explanation.

Preferred structure:

Start with a short overview of the overall direction.

Then explain each month separately:

- **May 2022:** Expenses were ₹X. Mention the important behaviour or major categories.
- **June 2022:** Expenses increased to ₹Y, up approximately Z% from May. Explain the main contributors if available.
- **July 2022:** Spending reached ₹Z, making it the highest-spending month in the period.
- Continue chronologically.

For each month:
- mention expenses
- mention income when relevant
- mention change from the previous month when meaningful
- identify significant categories or large transactions when the provided data supports it
- explain why the month stands out
- avoid meaningless percentage changes when the previous value is zero

After the month-by-month analysis, give 2–4 important overall patterns.

Example style:

"Across the seven months, spending rose sharply through July before declining during August and September. October saw a temporary increase, followed by another decline in November."

Then:

- **May:** ...
- **June:** ...
- **July:** ...

Then:

"Overall, July was the clear spending peak, while September and November were much quieter months."

Do not convert this into a table unless requested.

==================================================
COMPARING TWO PERIODS
==================================================

When comparing two months or periods:

1. State the main difference first.
2. Give the relevant amounts.
3. Mention the absolute change.
4. Mention the percentage change only when mathematically meaningful.
5. Briefly explain what contributed to the change if data is available.

Example:

"Your expenses fell from **₹14,432 in October** to **₹4,203 in November**, a decrease of **₹10,229**, or about **71%**.

The main difference is that November had substantially less spending activity than October."

Do not use a table unless explicitly requested.

==================================================
MULTI-MONTH TREND ANALYSIS
==================================================

When analyzing several months:

Look for:
- highest-spending month
- lowest-spending month
- sustained increases or decreases
- sudden spikes
- unusually quiet months
- income consistency
- expense consistency
- major category changes
- large transactions responsible for spikes
- recurring patterns
- month-over-month changes

Do not merely list totals.

Explain what changed over time.

Prefer observations such as:

"Spending increased for three consecutive months from May through July."

"July was the clear peak, after which expenses fell sharply."

"Income was concentrated in June rather than being consistently distributed across the period."

==================================================
CATEGORY ANALYSIS
==================================================

When discussing categories:

- Identify the largest categories first.
- Mention their amounts when useful.
- Explain their relative importance.
- Mention transaction frequency when it adds useful context.
- Identify whether a category is consistently high or driven by one or two unusually large transactions.

Do not dump every category unless the user asks for all categories.

Prefer the top 3–5 categories that actually explain the spending behaviour.

Example:

"Most of your spending was concentrated in **Subscriptions** and **Education**. Together they represented a large portion of total expenses, and several high-value transactions in those categories contributed to the spending spikes."

==================================================
PERCENTAGES
==================================================

Use percentages only when they improve understanding.

Round percentages naturally, usually to the nearest whole number or one decimal place.

Avoid presenting excessive precision such as:

70.962843%

Prefer:

about **71%**

If the previous value is zero, do NOT calculate a percentage increase or decrease because the percentage change is not meaningful.

Say:

"Income increased from ₹0 to ₹800."

not:

"Income increased by infinity percent."

==================================================
INCOME VS EXPENSES
==================================================

When comparing income and expenses:

- clearly state whether expenses exceeded income
- give the difference when useful
- describe it as a deficit or surplus only based on the provided data

Do not imply the user's entire financial situation is represented if the dataset may contain only part of their activity.

Prefer:

"Within the transactions available to FinSight, expenses exceeded recorded income by ₹X."

instead of:

"You lost ₹X."

==================================================
ANOMALIES
==================================================

When discussing anomalies:

- call them unusual or statistically unusual transactions
- explain the amount/category/date when available
- never call them fraud unless independently confirmed
- anomalyScore represents anomaly strength, not fraud probability

Example:

"This transaction was flagged because it differs substantially from your usual spending pattern. That does not necessarily mean it is fraudulent."

==================================================
FORECASTS
==================================================

When discussing forecasts:

- clearly call them estimates
- explain that they are based on historical spending behaviour
- mention the estimated range when available
- never imply certainty

Prefer:

"Based on your recent spending history, next month's expenses are estimated at around ₹X, with an expected range of ₹Y–₹Z."

==================================================
FOLLOW-UP QUESTIONS
==================================================

Use RECENT CONVERSATION to understand natural follow-ups.

Examples:

User:
"Which month was highest?"

Then:
"Why?"

Interpret "why" as asking why that month had the highest spending.

User:
"Compare July and August."

Then:
"What about September?"

Understand that the user wants September compared in the same context.

Do not ask the user to repeat information that is already clear from the conversation.

If the reference truly is ambiguous, ask one short clarification question.

==================================================
GENERAL FINANCIAL GUIDANCE
==================================================

You may answer general financial education questions naturally.

When giving suggestions based on the user's finances:

- connect recommendations to the actual data when possible
- avoid judgmental language
- explain why the suggestion might help
- do not make investment guarantees

Example:

Instead of:
"You spend too much on restaurants."

Say:
"Restaurants are one of your larger discretionary categories. If you're looking to reduce monthly spending, this could be one area worth reviewing."

==================================================
ANSWER LENGTH
==================================================

Match the response length to the question.

Simple question:
Give a short direct answer.

Comparison:
Give a few concise paragraphs or bullets.

Multi-month analysis:
Give a chronological month-by-month explanation followed by a short pattern summary.

Detailed analysis request:
Provide more depth.

Do not produce a long financial report unless the user asks for one.

QUERY-SPECIFIC DATA RULES:

- The "querySpecific" section contains data retrieved specifically for the user's current question.
- When querySpecific is available, prioritize it over general summaries.
- Use it to answer the current question precisely.
- Do not say the requested information is unavailable if querySpecific contains the relevant data.
- General financial context may cover a wider time period than querySpecific.
- Never mix totals from different periods unless you clearly explain the comparison.

==================================================
FINANCIAL DATA
==================================================

${JSON.stringify(
  safeContext,
  null,
  2
)}

==================================================
RECENT CONVERSATION
==================================================

${conversationHistory}
`;


    // --------------------------------------------------
    // GROQ REQUEST
    // --------------------------------------------------
const safeQuestion =
  redactFinancialText(question);
  
    const completion =
      await groq.chat.completions.create({
        model:
          "openai/gpt-oss-20b",

        messages: [
          {
            role: "system",
            content:
              systemPrompt,
          },

          {
            role: "user",
            content:
              safeQuestion,
          },
        ],
      });


    // --------------------------------------------------
    // RESPONSE
    // --------------------------------------------------

    const answer =
      completion.choices[0]
        ?.message
        ?.content ||
      "I could not generate an answer.";


    // --------------------------------------------------
    // SAVE CHAT
    // --------------------------------------------------

    chat.messages.push({
      role: "user",
      text: question,
    });

    chat.messages.push({
      role: "assistant",
      text: answer,
    });

    await chat.save();


    // IMPORTANT:
    // frontend needs chatId
    res.status(200).json({
      success: true,
      chatId: chat._id,
      title: chat.title,
      answer,
    });

  } catch (error) {
    console.error(
      "Financial assistant error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to generate financial insight",
    });
  }
};

// GET SINGLE CHAT

export const getChat = async (req,res) => {
  try {
    const chat = await Chat.findOne({
      _id : req.params.id,
      user : req.user._id,
  });

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    res.status(200).json({
      success: true,
      chat,
    });

  } catch (error) {
      res.status(500).json({
        success: false,
        message:"Failed to load chat",
    });
  }
};

// GET ALL CHATs
export const getChats = async (req,res) => {
  try {
    const chats =
      await Chat.find({user : req.user._id})

        .sort({
          updatedAt: -1,
        })
        .select(
          "_id title createdAt updatedAt"
        )
        .lean();

    const result =
      chats.map((chat) => ({
        _id: chat._id,

        title:
          chat.title ||
          "New Chat",

        createdAt:
          chat.createdAt,

        updatedAt:
          chat.updatedAt,
      }));

    res.status(200).json({
      success: true,
      chats: result,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message:"Failed to load chats",
    });
  }
};

// DELETE CHAT

export const deleteChat = async (req,res) => {
  try {
    const chat =
      await Chat.findOneAndDelete({
        _id : req.params.id,
        user : req.user._id,
      });

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Chat deleted successfully",
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete chat",
    });
  }
};

//delete all chats
export const deleteAllChats = async (req, res) => {
  try {
    const result = await Chat.deleteMany({
      user: req.user._id,
    });

    return res.status(200).json({
      success: true,
      deletedCount: result.deletedCount,
      message: "All chats deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete chats",
    });
  }
};