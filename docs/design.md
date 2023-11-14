# Design Overview

The requirement that "reasonably performant with >1GB" indicates a solution featuring the nodes streaming API.  
Node's streaming API features backpressure, which keeps too much data from buffering up in memory.

For assumptions made, see the assumptions.md file.

# The Pipeline

     Reverse File Reader  <---> Reverse Lines Transformer <---> Express Web Writer

Reverse File Reader

- Read the file backwards in chunks.
- push the backwards chunks into a pipeline.

A transformer extracts the lines with the class ReverseLinesExtractor helper

- applies filter if applicable
- stops processing if n lines limit is reached

The writer for the pipeline is provided by express
