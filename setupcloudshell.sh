#!/bin/bash

chmod o-r /tmp
chmod -R a-w ~cloudshell
chown -R root:wheel ~cloudshell
chmod a+r ~cloudshell/.ssh/authorized_keys
cat > ~cloudshell/.bashrc <<EOF
force_color_prompt=yes
cd \`mktemp -d\`
export HOME=\`pwd\`
EOF