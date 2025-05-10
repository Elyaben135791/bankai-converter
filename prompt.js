function generatePrompt(text) {
  return `
You are a professional financial analyst.

Convert the following raw bank transactions into a clean, organized CSV format with these columns:

Date, Description, Amount, Currency, Category

Here are the transactions:
${text}

Only output the formatted CSV rows — no explanations.
  `;
}

module.exports = { generatePrompt };
