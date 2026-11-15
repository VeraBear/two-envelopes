const $ = id => document.getElementById(id);
let base = 10, low, high, chosen, other, observedPower = 2;
const money = n => n >= 1e9 ? `$${n.toExponential(2)}` : `$${n.toLocaleString('en-US',{maximumFractionDigits:2})}`;
const powerText = (b, n) => n === 0 ? '1' : `${b}<sup>${n}</sup>`;

function makeRound(){
  let heads = 0; while(Math.random() < .5 && heads < 9) heads++;
  low = base ** heads; high = low * base; chosen = other = null;
  document.querySelectorAll('.envelope').forEach(e => { e.classList.remove('open','dim'); e.querySelector('.seal').textContent='?'; e.disabled=false; });
  $('choiceActions').hidden = true; $('roundResult').hidden = true; $('newRound').hidden = true;
  $('gameTitle').textContent = 'Pick an envelope.'; $('gameNarration').textContent = `The envelopes are indistinguishable. One holds ${base} times the other.`;
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
  observedPower=power; const seen=base**power, higher=seen*base, lower=seen/base;
  document.querySelectorAll('[data-power]').forEach(b=>b.classList.toggle('selected',Number(b.dataset.power)===power));
  $('seenAmount').textContent=money(seen);
  if(power===0){
    $('highStory').textContent=money(higher); $('lowStory').textContent='Impossible'; $('highProb').textContent='certainty'; $('lowProb').textContent='0 chance';
    $('switchMath').textContent=`1 × ${money(higher)} − $1`; $('switchValue').textContent=money(higher-1); $('mathNote').textContent=`Seeing $1 is special: there is no smaller positive power of ${base}.`;
  } else {
    const expected=(higher/3)+(2*lower/3)-1;
    $('highStory').textContent=money(higher); $('lowStory').textContent=money(lower); $('highProb').textContent='1/3 chance'; $('lowProb').textContent='2/3 chance';
    $('switchMath').textContent=`⅓ × ${money(higher)} + ⅔ × ${money(lower)} − $1`; $('switchValue').textContent=money(expected);
    $('mathNote').textContent=expected>seen ? `That is more than the ${money(seen)} you already hold. Locally, switch.` : expected===seen ? `That exactly matches ${money(seen)} before the $1 fee; switching is worse.` : `That is less than ${money(seen)}. With this base, keep the envelope.`;
  }
}
function updatePicker(){
  document.querySelector('.amount-picker div').innerHTML=[0,1,2,3,4].map(n=>`<button type="button" data-power="${n}">${money(base**n)}</button>`).join('');
  document.querySelectorAll('[data-power]').forEach(b=>b.addEventListener('click',()=>updateReasoning(Number(b.dataset.power))));
}
function levelContribution(n){ return ((1+base)/2) * ((base/2)**n); }
function updateSeries(){
  $('pairFormula').innerHTML = `${powerText(base,'n')} + ${powerText(base,'n+1')}`;
  $('seriesRows').innerHTML=[0,1,2,3].map(n=>`<p><span>${n}</span><span>1/${2**(n+1)}</span><span>${money(levelContribution(n))}</span></p>`).join('') + `<p><span>n</span><span>2<sup>−n−1</sup></span><span>${(1+base)/2} × (${base}/2)<sup>n</sup></span></p>`;
  const mode=base===2?'same':'grow';
  $('seriesConclusion').textContent=base===2 ? 'Each new level adds the same positive amount. Adding infinitely many of them still diverges.' : `Each rare level contributes ${base/2}× as much as the prior one. The expected value diverges.`;
  $('quizResponse').dataset.answer=mode; $('quizResponse').textContent='Choose an answer, then inspect the table.';
  document.querySelectorAll('[data-answer]').forEach(b=>b.classList.remove('correct','wrong'));
}
function setBase(next){
  base=next; observedPower=2;
  document.querySelectorAll('[data-base]').forEach(b=>b.classList.toggle('selected',Number(b.dataset.base)===base));
  $('heroDescription').textContent=`Two envelopes. One holds ${base} times the other. You open one—and the seemingly rational choice leads somewhere strange.`;
  $('ruleBase').innerHTML=`If it takes <i>n</i> heads, he writes <i>${base}ⁿ</i> and <i>${base}ⁿ⁺¹</i> on the envelopes.`;
  updatePicker(); updateReasoning(observedPower); updateSeries(); makeRound();
}

$('envelopeLeft').addEventListener('click',()=>selectEnvelope('envelopeLeft'));
$('envelopeRight').addEventListener('click',()=>selectEnvelope('envelopeRight'));
$('keepButton').addEventListener('click',()=>finish(false)); $('switchButton').addEventListener('click',()=>finish(true)); $('newRound').addEventListener('click',makeRound);
document.querySelectorAll('[data-base]').forEach(b=>b.addEventListener('click',()=>setBase(Number(b.dataset.base))));
document.querySelectorAll('[data-answer]').forEach(button=>button.addEventListener('click',()=>{
  const actual=$('quizResponse').dataset.answer, chosenAnswer=button.dataset.answer, correct=chosenAnswer===actual;
  document.querySelectorAll('[data-answer]').forEach(b=>b.classList.remove('correct','wrong'));
  button.classList.add(correct?'correct':'wrong');
  $('quizResponse').textContent=correct ? (actual==='same' ? 'Exactly. The terms do not get smaller; infinitely many equal positive terms still add to infinity.' : `Exactly. Probability halves, but the payout grows by ${base}×, so each level contributes ${base/2}× more.`) : (actual==='same' ? 'Look again: each row adds the same positive amount.' : 'Look again: the payout outgrows the probability drop. Each contribution gets larger.');
}));
setBase(10);
