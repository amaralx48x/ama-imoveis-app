import {genkit, firebase} from 'genkit';
import {vertexAI} from '@genkit-ai/vertexai';
import {firebase as firebasePlugin} from '@genkit-ai/firebase';

export const ai = genkit({
  plugins: [
    firebasePlugin({
      firestore: {
        // As collections are added, they can be added to this list.
        collections: ['agents'],
      },
    }),
    vertexAI(),
  ],
  model: 'vertexai/gemini-2.5-flash',
});
