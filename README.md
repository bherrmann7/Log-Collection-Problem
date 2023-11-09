
# Log Collection Problem

This github repo is a crack at solving a problem of accessing remote log files efficiently.

See problem.md, assumptions.md and design.md for details.

To run the tests, use
    $ npm run test

# usage

    On the host with the log files, with a user who has read access to the log files
    $ node server
    Server Listening on PORT: 3000

    In another host, or terminal
    $ curl http://localhost:3000?filename=dmesg
    ...

    To get single line
    $ curl 'http://localhost:3000?filename=dmesg&n=1'

    Line with Bluetooth in it.
    $ curl 'http://localhost:3000?filename=dmesg&n=3&filter=Bluetooth'
    [   14.624771] kernel: Bluetooth: MGMT ver 1.22
    [   14.559749] kernel: Bluetooth: hci0: HCI LE Coded PHY feature bit is set, but its usage is not supported.
    [   14.557740] kernel: Bluetooth: hci0: Firmware revision 0.4 build 206 week 22 2023


