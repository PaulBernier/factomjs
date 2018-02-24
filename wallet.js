function getBalance(x) {
    // TODO: detect type of X and redirect
    // TODO: implement https://github.com/FactomProject/factom/blob/a0a55096f9d2aeb5cb63b8b5a714a285f3a100b3/addresses.go#L43
    return factomdjs.entryCreditBalance(x)
        .then(res => res.balance);
}