# Assumptions

- I'm presuming ascii for the log files (when detecting new lines), although it would be better to move backwards through the buffer using the unicode
  high order bit for detecting character boundaries. This was not mentioned as a requirement.

- I'm assuming lines are shorter than the bufferSize, mostly to make my life easier. A binary file would not be handled well. Line length limits were
  not mentioned as a requirement.

- the very first chunk reading from the log file could contain a partial line, this will be discarded as incomplete.

- this solution has no authentication and/or authorization

- this solution does not encrypt traffic over the wire

- the running user is part of the "adm" group and/or can read most files in /var/log/\*

- node and tests are on some unix variant (ie. the Windows subsystem for linux, or linux or Mac.) so I dont have to fiddle with paths building
