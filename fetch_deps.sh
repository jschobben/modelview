#!/bin/sh
THREE_JS_VERSION=r130

download() {
	DEST=$1
	mkdir -p "${DEST%/*}"
	# Atomically create file, abort if it already exists
	if ! (set -o noclobber; > "$DEST") 2>/dev/null; then
		return 1
	fi
	DEP=${DEST#./deps/}
	DEP=${DEP%%/*}
	if [ "$DEP" = three.js ]; then
		URL=https://raw.githubusercontent.com/mrdoob/three.js/${THREE_JS_VERSION}
	else
		echo "Unknown dep: '$DEST'"
		exit 1
	fi
	SRC=${DEST#./deps/${DEP}/}
	echo "Fetching ${DEST}"
	wget --quiet "${URL}/${SRC}" -O - > "${DEST}"
	return 0
}

get_missing_deps() {
	local FILE=$1
	local DIR=${FILE%${FILE##*/}}
	for DEP in $(sed -En "s/^import .* from '(.*)';/\1/ p" "$FILE"); do
		FULL_DEP=$(echo "${DIR}${DEP}" | sed -E 's#/[^/]*/\.\./#/#g')
		if download "$FULL_DEP"; then
			get_missing_deps "$FULL_DEP"
		fi &
	done
	wait
}

get_missing_deps modelview.js

cd deps
for PATCH in ../*.patch; do
	PATCH_APPLIED=${PATCH#../}.applied
	if ! [ -e "${PATCH_APPLIED}" ]; then
		echo "Applying ${PATCH}"
		patch -p0 < "${PATCH}"
		touch "${PATCH_APPLIED}"
	fi
done
