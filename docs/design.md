I think the requirement that "reasonably performant with >1GB" means that we need to use nodes streaming API.  
It features backpressure

pipeline
Backwards Stream Reader <---> Line Transformer <---> Web Writer

Backwards Stream reader

- Read the file backwards in chunks.
- push the backwards chunks into a pipleine.

A transformer extracts the lines. with the LinesDecoder Helper

- applies filter if applicable
- stops processing if n lines is reached

Web writer is from express
