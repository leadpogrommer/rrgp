async function showAD() {
    const cookieName = "DONOTSHOWADS"

    if(document.cookie.search(cookieName) !== -1) return;

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms))
    }
    // await sleep(500)

    let cpa;
    let closePromise = new Promise((resolve, reject)=>{cpa = resolve})


    document.getElementsByClassName('ad-wrapper')[0].classList.remove("ad-hidden")
    document.getElementsByClassName("ad-close")[0].addEventListener("click", () => {
        cpa();
    })


    await closePromise

    if (document.getElementById("ad-not-again").checked){
        document.cookie = `${cookieName}=true; max-age=${2*24*60*60}`
    }

    document.body.removeChild(document.getElementsByClassName('ad-wrapper')[0])

}