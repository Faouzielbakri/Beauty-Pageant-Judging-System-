import { database, auth } from "./firebase";
import React, { useEffect, useState } from "react";

function Judge() {
  const [curentmale, setcurentmale] = useState({});
  const [curentfemale, setcurentfemale] = useState({});
  const [round, setround] = useState(1);

  useEffect(() => {
    const sub = database
      .collection("currentContestants")
      .orderBy("ContestantNo")
      .onSnapshot((snapShot) => {
        if (!snapShot?.empty) {
          snapShot.forEach((contestant) => {
            //seperate the applications based on gendre
            if (contestant?.id === "male") {
              setcurentmale({ ...contestant.data() });
            } else {
              setcurentfemale({ ...contestant.data() });
            }
          });
        } else {
          //   alert("No Contestant to Show right now");
        }
      });
    return sub;
  }, []);

  useEffect(() => {
    const sub = database
      .collection("Round")
      .doc("round")
      .onSnapshot((doc) => {
        if (doc.data() && doc.data()?.round) {
          setround(doc.data().round);
        } else {
          setround(1);
        }
      });
    return sub;
  }, []);
  useEffect(() => {
    const judgeSub = database
      .collection("Judges")
      .doc(`${auth().currentUser.uid}`)
      .get()
      .then((data) => {
        if (!data.exists) {
          data.ref.set({ email: auth().currentUser.email });
        }
      });
    return judgeSub;
  }, []);
  //judges submit
  const Submit = (e) => {
    e.preventDefault();
    var dataToSet = {};
    dataToSet[`round${round}`] = Number(e.target[0].value);
    if (e.target[0].name === "male")
      dataToSet[`ContestantNo`] = curentmale.ContestantNo;
    else dataToSet[`ContestantNo`] = curentfemale.ContestantNo;
    dataToSet[`Gender`] = e.target[0].name;
    database
      .collection("Judges")
      .doc(`${auth().currentUser.uid}`)
      .collection("marks")
      .doc(`${dataToSet[`ContestantNo`]}`)
      .get()
      .then((docsRef) => {
        try {
          if (docsRef.exists) {
            database
              .collection("Judges")
              .doc(`${auth().currentUser.uid}`)
              .collection("marks")
              .doc(`${dataToSet[`ContestantNo`]}`)
              .set(dataToSet);
          } else {
            docsRef.ref.update(dataToSet);
          }
          e.target[0].name === "male" ? setcurentmale({}) : setcurentfemale({});
        } catch (error) {
          console.log(error);
        }
      });
  };
  return (
    <div className="App">
      <div className="nav_bar_container">
        <a href="#criteria_info">Pegeant Criteria</a>
        <a href="#contestant">Contestant</a>
        <a
          href="#logout"
          onClick={() => {
            auth().signOut();
          }}
        >
          Log Out
        </a>
      </div>
      <div className="criteria_info_div" id="criteria_info">
        <section id="panel-3">
          <main>
            <header>
              <h3>Mr and Miss IUM Judging Criteria 2021</h3>
              <p>Here is the 2021 Judging Criteria</p>
            </header>

            <table class="judge-rounds-criteria table">
              <tr>
                <th>Rounds</th>
                <th>Criteria</th>
                <th>Rating</th>
              </tr>
              <tr>
                <td>Round1-Introduction</td>
                <td>Confidence, Eye Contact, Smile</td>
                <td>30</td>
              </tr>
              <tr>
                <td>Round2-Casual Wear</td>
                <td>Unique style, Personality, Talent</td>
                <td>30</td>
              </tr>
              <tr>
                <td>JRound3-Swim Wear</td>
                <td>Swim Suits, Healthy Body Figure, Audience Interaction</td>
                <td>30</td>
              </tr>
              <tr>
                <td>Round4-Evening Wear</td>
                <td>
                  Gown or Suit, Ability to answer judge question, Authenticity
                  and Individuality
                </td>
                <td>30</td>
              </tr>
            </table>
          </main>
        </section>
      </div>
      <div class="contestant_div" id="contestant">
        <h3>Beauty Pageant Judging System</h3>
        <h4>
          Round <span className="roundNumberSpan">{round}</span>
        </h4>
        <div className="contestant_info_container">
          <form className="contestant male" onSubmit={Submit}>
            {JSON.stringify(curentmale) !== "{}" ? (
              <>
                <h3>Male Contestants</h3>
                <span>Contestant number : {curentmale.ContestantNo}</span>
                <h4 id="contestant_name">{`${curentmale.firstName} ${curentmale.lastName}`}</h4>
                <h4 id="contestant_name">From {curentmale.Nationality}</h4>
                <div className="inputs_container">
                  <div>
                    <span>round score</span>
                    <input
                      type="number"
                      name="male"
                      placeholder="0"
                      max={10}
                      min={0}
                    />
                  </div>
                </div>
                <div className="form_buttons">
                  <button type="submit">Submit</button>
                </div>
              </>
            ) : (
              <span>Waiting For Admin To Show Next Male Contestant</span>
            )}
          </form>
          <form className="contestant female" onSubmit={Submit}>
            {JSON.stringify(curentfemale) !== "{}" ? (
              <>
                <h3>Female Contestants</h3>
                <span>Contestant number : {curentfemale.ContestantNo}</span>
                <h4 id="contestant_name">{`${curentfemale.firstName} ${curentfemale.lastName}`}</h4>
                <h4 id="contestant_name">From {curentfemale.Nationality}</h4>
                <div className="inputs_container">
                  <div>
                    <span>round score</span>
                    <input
                      type="number"
                      name="female"
                      placeholder="0"
                      max={10}
                      min={0}
                    />
                  </div>
                </div>
                <div className="form_buttons">
                  <button type="submit">Submit</button>
                </div>
              </>
            ) : (
              <span>Waiting For Admin To Show Next Female Contestant</span>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

export default Judge;
