npm run dev 








“ I’m building a a simple AR application web based in which

- live webcam is mirroed full screen 
- hands are tracked (use Media Pipe)
- use three js for drawing over
- user can choose with specified gestures (there is a help) between three simple effects

effects 1 create coloured rings around fingers , moving hand the rings draw evanescene fire

effect 2 create a wireframed 3d cute object (a small wireframe flower) that user can pinch to mve around 3d space

effect 3 draws cute wide coloured lines following index fingers.
Give me the full architecture:
- File + folder structure
- What each part does
- Where state lives, how services connect
Format this entire document in markdown.”



Using that architecture, write a granular step-by-step plan to build the MVP.
Each task should:
- Be incredibly small + testable
- Have a clear start + end
- Focus on one concern
I’ll be passing this off to an engineering LLM that will be told to complete one task at a time, allowing me to test in between.



You’re an engineer building this codebase.
You've been given http://architecture.md and http://tasks.md.
- Read both carefully. There should be no ambiguity about what we’re building.
- Follow http://tasks.md and complete first and second task