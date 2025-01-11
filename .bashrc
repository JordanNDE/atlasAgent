# NVM auto-switching
find_up() {
    path=$(pwd)
    while [[ "$path" != "" && ! -e "$path/$1" ]]; do
        path=${path%/*}
    done
    echo "$path"
}

cdnvm() {
    cd "$@"
    nvm_path=$(find_up .nvmrc)

    if [[ -e "$nvm_path/.nvmrc" ]]; then
        nvm use
    elif [[ $(nvm version) != $(nvm version default) ]]; then
        echo "Reverting to nvm default version"
        nvm use default
    fi
}

alias cd='cdnvm'

# Run when opening a new terminal in a directory with .nvmrc
if [[ -f ".nvmrc" ]]; then
    nvm use
fi