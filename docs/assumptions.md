# Assumptions

- I'm presuming ascii for the log files (when detecting new lines), although it would be better to move backwards through the buffer using the unicode
  high order bit for detecting character boundaries. Most of the /var/log/_.log files on my machine do not contain UTF-8. This was not mentioned as a requirement.
  $ for each in `ls -1 /var/log/_.log`; do grep -P "[\x80-\xFF]" $each; done

- A maximum line length was not specified, using files with very long lines (greater than 16383) would likely result in unexpected behavior

- the very first chunk reading from the log file could contain a partial line, this will be discarded as incomplete.

- this solution has no authentication and/or authorization

- this solution does not encrypt traffic over the wire

- the running user is presumed to have read access to files in /var/log (aka part of the "adm" group, or files in /var/log are world read)

- node and tests are on some unix variant (ie. the Windows subsystem for linux, or linux or Mac.), ie /tmp/ exists.
