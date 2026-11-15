const money = n => `$${n.toLocaleString('en-US')}`;
let low, high, chosen, other, observedPower = 2;
const $ = id => document.getElementById(id);

function makeRound(){
  let heads = 0; while(Math.random() < .5 && heads < 9) heads++;
  low = 10 ** heads; high = low * 10;
  chosen = other = null;
  document.querySelectorAll('.envelope').forEach(e => { e.classList.remove('open','dim'); e.querySelector('.seal').textContent='?'; e.disabled=false; });
  $('choiceActions').hidden = true; $('roundResult').hidden = true; $('newRound').hidden = true;
  $('gameTitle').textContent = 'Pick an envelope.'; $('gameNarration').textContent = 'The envelopes are indistinguishable. Choose one; the other stays sealed.';
  $('coinTrail').innerHTML = Array.from({length:Math.min(heads+1,5)},(_,i)=>`<span>${i<heads?'H':'T'}</span>`).join('') + '<small>Harry’s hidden coin tosses</small>';
}
function selectEnvelope(id){
  if(chosen) return;
  const picked = $(id), unpicked = id === 'envelopeLeft' ? $('envelopeRight') : $('envelopeLeft');
  chosen = Math.random() < .5 ? low : high; other = chosen === low ? high : low;
  picked.classList.add('open'); picked.querySelector('.seal').textContent = money(chosen); unpicked.classList.add('dim');
  $('keepAmount').textContent = money(chosen); $('choiceActions').hidden=false; $('gameTitle').textContent = `You found ${money(chosen)}.`; $('gameNarration').textContent = 'Now decide before seeing the second envelope.';
}
function finish(switched){
  document.querySelectorAll('.envelope').forEach(e=>e.disabled=true);
  const receive = switched ? other - 1 : chosen;
  $('roundResult').hidden=false; $('roundResult').innerHTML = switched ? `You switched. The other envelope held <strong>${money(other)}</strong>; after the $1 fee, you receive <strong>${money(receive)}</strong>.` : `You kept your envelope and receive <strong>${money(chosen)}</strong>. The other envelope held <strong>${money(other)}</strong>.`;
  $('choiceActions').hidden=true; $('newRound').hidden=false;
}
function updateReasoning(power){
  observedPower=power; const seen=10**power, higher=seen*10, lower=seen/10;
  document.querySelectorAll('[data-power]').forEach(b=>b.classList.toggle('selected',Number(b.dataset.power)===power));
  $('seenAmount').textContent=money(seen);
  if(power===0){
    $('highStory').textContent=money(higher); $('lowStory').textContent='Impossible'; $('highProb').textContent='certainty'; $('lowProb').textContent='0 chance';
    $('switchMath').textContent=`1 × ${money(higher)} − $1`; $('switchValue').textContent=money(higher-1); $('mathNote').textContent='Seeing $1 is special: there is no smaller positive power of ten in this game.';
  } else {
    const expected=(higher/3)+(2*lower/3)-1;
    $('highStory').textContent=money(higher); $('lowStory').textContent=money(lower); $('highProb').textContent='1/3 chance'; $('lowProb').textContent='2/3 chance';
    $('switchMath').textContent=`⅓ × ${money(higher)} + ⅔ × ${money(lower)} − $1`; $('switchValue').textContent=money(expected); $('mathNote').textContent=`That is more than the ${money(seen)} you already hold. So, locally, switch.`;
  }
}
$('envelopeLeft').addEventListener('click',()=>selectEnvelope('envelopeLeft'));
$('envelopeRight').addEventListener('click',()=>selectEnvelope('envelopeRight'));
$('keepButton').addEventListener('click',()=>finish(false)); $('switchButton').addEventListener('click',()=>finish(true)); $('newRound').addEventListener('click',makeRound);
document.querySelectorAll('[data-power]').forEach(b=>b.addEventListener('click',()=>updateReasoning(Number(b.dataset.power))));
makeRound(); updateReasoning(2);
