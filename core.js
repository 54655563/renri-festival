(() => {
  const ids = ['fortune','cake','climb','dress'];
  const empty = () => ({stamps:[], scores:[], summit:false, roundId:null, submittedRound:null});
  function stamp(state,id,patch={}) {
    const stamps = ids.filter(key => key === id || state.stamps.includes(key));
    return {state:{...state,...patch,stamps},celebrate:stamps.length === 4 && state.stamps.length !== 4};
  }
  const api = {ids,empty,stamp};
  if (typeof module !== 'undefined') module.exports = api;
  else window.FestivalCore = api;
})();
