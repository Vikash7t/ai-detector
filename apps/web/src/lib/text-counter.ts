/**
 * Counts total Unicode code points, handling surrogate pairs and emoji identically to backend.
 */
export function countCodePoints(text: string): number {
  if (!text) return 0;
  let count = 0;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  for (const _ of text) {
    count++;
  }
  return count;
}

/**
 * Counts words by non-whitespace sequences matching backend logic.
 */
export function countWords(text: string): number {
  if (!text) return 0;
  const matches = text.match(/\S+/g);
  return matches ? matches.length : 0;
}

export const SAMPLE_AI_TEXT = `Artificial intelligence is increasingly integrated into modern software engineering workflows. Natural language processing models demonstrate an unprecedented capacity to generate coherent, stylistically diverse text across various technical domains. Furthermore, machine learning architectures continually optimize statistical perplexity, enabling the synthesis of complex explanations and programmatic documentation with remarkable syntactic fluency. In the realm of automated content generation, sophisticated generative transformers utilize deep self-attention mechanisms to evaluate contextual dependencies across long token sequences. Consequently, the distinction between machine-synthesized prose and human craftsmanship necessitates robust probabilistic and linguistic evaluation frameworks.`;

export const SAMPLE_HUMAN_TEXT = `When I first started tinkering with electronics back in high school, nothing ever worked on the first try. I remember spending three straight weekends trying to get a simple FM radio receiver to pick up a clear broadcast. Every solder joint looked like a burnt blob of metal, and the smell of melted rosin filled my entire bedroom. My grandfather finally walked in, looked at the messy copper breadboard, and told me that patience was the real component I was missing. He showed me how to heat the pad before applying the solder wire. That small tip changed everything, and twenty minutes later, a scratchy jazz station came crackling through the tiny speaker.`;
