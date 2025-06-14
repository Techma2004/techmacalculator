let outputscreen=document.getElementById('output-onscreen');
function display(num){outputscreen.value +=num}
function calculate(){try{outputscreen.value = eval 
(outputscreen.value)}catch(err){alert("how far but what you typed was wrong check it and try again")}}
function clr(){outputscreen.value=''}
function del(){outputscreen.value=outputscreen.value.slice(o,-1)}
