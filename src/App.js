import { database, auth } from "./firebase";
import { useEffect, useState } from "react";
import "./App.css";
import "./styles.css";
import { AdminEmail } from "./constants";
import Modal from "react-modal";

function App() {
  const [males, setmales] = useState([]);
  const [females, setfemales] = useState([]);
  const [maleIndex, setmaleIndex] = useState(0);
  const [femaleIndex, setfemaleIndex] = useState(0);
  const [user, setuser] = useState({});
  const [round, setround] = useState(1);
  const [scoresState, setscores] = useState({});
  const [finalScoreState, setfinalScore] = useState({});
  const [modalIsOpen, setmodalIsOpen] = useState(false);
  const [top, settop] = useState([]);
  const [winners, setwinners] = useState([]);
  //get all accepted applications ordered By contestant No.
  useEffect(() => {
    // console.log(database.app);
    const collectionName = round > 2 ? "TopCualified" : "AcceptedApplications";

    const sub = database
      .collection(collectionName)
      .orderBy("ContestantNo")
      .onSnapshot((snapShot) => {
        if (!snapShot?.empty) {
          const male_list = [];
          const femmale_list = [];
          snapShot.forEach((contestant) => {
            //seperate the applications based on gendre
            if (contestant?.data().Gender === "male") {
              male_list.push({ id: contestant.id, ...contestant.data() });
            } else {
              femmale_list.push({ id: contestant.id, ...contestant.data() });
            }
          });
          setmales(male_list);
          setfemales(femmale_list);
        } else {
          alert(
            "no is cualified to round 3 and 4\nmaybe ask to admin to calculte scores and move the contestants to round 3"
          );
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
    setmaleIndex(0);
    setfemaleIndex(0);
  }, [round]);

  const Submit = (e) => {
    e.preventDefault();
    console.log("submited");
    var dataToSet = {};
    dataToSet[`round${round}`] = Number(e.target[0].value);
    if (e.target[0].name === "male")
      dataToSet[`ContestantNo`] = males[maleIndex].ContestantNo;
    else dataToSet[`ContestantNo`] = females[femaleIndex].ContestantNo;
    console.log(e.target[0].name);
    database
      .collection("Judges")
      .doc(`${user.uid}`)
      .collection("marks")
      .where("ContestantNo", "==", dataToSet[`ContestantNo`])
      .get()
      .then((docsRef) => {
        let tempIndexHolder = maleIndex;
        if (e.target[0].name === "female") tempIndexHolder = femaleIndex;
        try {
          if (docsRef.empty) {
            database
              .collection("Judges")
              .doc(`${user.uid}`)
              .collection("marks")
              .doc()
              .set(dataToSet);
          } else {
            docsRef.forEach((docuRef) => {
              docuRef.ref.update(dataToSet);
            });
          }
          console.log(
            maleIndex + 1,
            femaleIndex + 1,
            "Index Of next Contestant"
          );
          if (e.target[0].name === "male") {
            setmaleIndex(maleIndex + 1);
          } else {
            setfemaleIndex(femaleIndex + 1);
          }
        } catch (error) {
          if (e.target.value[0] === "male") {
            maleIndex === tempIndexHolder
              ? console.log("equal")
              : maleIndex > tempIndexHolder
              ? setmaleIndex(maleIndex - 1)
              : setmaleIndex(maleIndex + 1);
          } else {
            femaleIndex === tempIndexHolder
              ? console.log("equal")
              : femaleIndex > tempIndexHolder
              ? setfemaleIndex(femaleIndex - 1)
              : setfemaleIndex(femaleIndex + 1);
          }
        }
      });
  };
  useEffect(() => {
    const authSub = auth().onAuthStateChanged((userInfo) => {
      // console.log(userInfo);
      if (userInfo) {
        setuser(userInfo);
        database
          .collection("Judges")
          .doc(`${userInfo.uid}`)
          .get()
          .then((doc) => {
            if (!doc.exists) {
              database
                .collection("Judges")
                .doc(`${userInfo.uid}`)
                .set({
                  email: userInfo?.email ? userInfo?.email : "email",
                });
            }
          });
      } else {
        setuser({});
      }
    });
    return authSub;
  }, []);
  const Login = (e) => {
    e.preventDefault();
    console.log(e.target[0].value, e.target[1].value);
    auth().signInWithEmailAndPassword(e.target[0].value, e.target[1].value);
  };
  const registerTopCualified = () => {
    database
      .collection("TopCualified")
      .get()
      .then((snapShot) => {
        if (snapShot.size != 0) {
          snapShot.forEach((Doc) => {
            Doc.ref.delete();
          });
          setTimeout(() => {
            registerTopCualified();
          }, 1000);
        } else {
          top.forEach((element) => {
            database
              .collection("TopCualified")
              .doc(`${element?.id}`)
              .set(element);
          });
        }
      });
  };
  const getTop = (limit = 10) => {
    const result =
      JSON.stringify(finalScoreState) !== "{}"
        ? Object.keys(finalScoreState)
            .sort((a, b) => finalScoreState[a] - finalScoreState[b])
            .reverse()
            .map((key, index) => {
              males.concat(females).forEach((human) => {
                if (human.ContestantNo === Number(key)) {
                  return human;
                }
                return undefined;
              });
            })
        : "Calculate Scores First";
    if (Array.isArray(result)) return result.filter((n) => n).slice(0, limit);
    else return result;
  };
  const currentRoundScoresCalculator = async () => {
    let scores = {};

    males.concat(females).forEach((m) => {
      scores[`${m?.ContestantNo}`] = 0;
    });

    var groupedArray = males.concat(females);
    groupedArray.forEach((element) => {
      database
        .collection("Judges")
        .get()
        .then((judgeRef) => {
          if (!judgeRef.empty) {
            judgeRef.forEach((judge) => {
              judge.ref
                .collection("marks")
                .where("ContestantNo", "==", element.ContestantNo)
                .get()
                .then((marksRef) => {
                  if (!marksRef.empty) {
                    marksRef.forEach((contest) => {
                      var tempJudgeHolder = scoresState;
                      if (
                        tempJudgeHolder[`${judge.id}`] === {} ||
                        tempJudgeHolder[`${judge.id}`] !== undefined
                      ) {
                        tempJudgeHolder[`${judge.id}`][
                          `${element.ContestantNo}`
                        ] = getContestantScore(round, contest.data());
                      } else {
                        tempJudgeHolder[`${judge.id}`] = {};
                        tempJudgeHolder[`${judge.id}`][
                          `${element.ContestantNo}`
                        ] = getContestantScore(round, contest.data());
                      }

                      setscores({ ...tempJudgeHolder });
                    });
                  }
                });
              console.log("holderJudge", scoresState);
            });
            var finalScore = {};
            Object.keys(scoresState).forEach((key) => {
              // console.log(scores, key);
              Object.keys(scoresState[key]).forEach((subKey) => {
                if (finalScore[subKey]) {
                  finalScore[subKey] += scoresState[key][subKey];
                } else {
                  finalScore[subKey] = scoresState[key][subKey];
                }
              });
            });
            setfinalScore(finalScore);
            // console.log(
            //   "fine",
            //   Object.keys(finalScore)
            //     .sort((a, b) => finalScore[a] - finalScore[b])
            //     .reverse()
            // );
          }
        })
        .then((results) => {});
    });
  };
  const getContestantScore = (rnd, data) => {
    switch (rnd) {
      case 1:
        return data[`round1`] ? Number(data[`round1`]) : 0;
      case 2:
        return data[`round2`]
          ? data[`round1`]
            ? Number(data[`round2`]) + Number(data[`round1`])
            : Number(data[`round2`])
          : data[`round1`]
          ? Number(data[`round2`]) + Number(data[`round1`])
          : 0;
      case 3:
        return data[`round3`] ? Number(data[`round3`]) : 0;
      case 4:
        return data[`round4`]
          ? data[`round3`]
            ? Number(data[`round4`]) + Number(data[`round3`])
            : Number(data[`round4`])
          : data[`round3`]
          ? Number(data[`round4`]) + Number(data[`round3`])
          : 0;

      default:
        return 0;
    }
  };
  if (JSON.stringify(user) !== "{}") {
    if (user.email === AdminEmail)
      return (
        <div className="App">
          <div className="nav_bar_container">
            <a href="#round"> Round</a>
            <a
              href="#scores"
              onClick={() => {
                console.log(user.uid);
              }}
            >
              Scores
            </a>
            <a
              href="#logout"
              onClick={() => {
                auth().signOut();
              }}
            >
              Log Out
            </a>
          </div>
          <div className="round" id="round">
            <button
              onClick={() => {
                round > 1 &&
                  database
                    .collection("Round")
                    .doc("round")
                    .update({ round: round - 1 });
              }}
            >{`<`}</button>
            <h3>Round : {round}</h3>
            <button
              onClick={() => {
                round < 4 &&
                  database
                    .collection("Round")
                    .doc("round")
                    .update({ round: round + 1 });
              }}
            >{`>`}</button>
          </div>
          <div className="scores fullscreen" id="scores">
            <div className="left">
              <span onClick={() => setmodalIsOpen(true)}>
                After Calculating The current round score You select only top
                Contestants to the next round
              </span>
              <button
                disabled={(round !== 2) & (round !== 4)}
                onClick={() => {
                  const temp = getTop(round === 2 ? 10 : round === 4 ? 3 : 500);
                  if (Array.isArray(temp)) {
                    settop(temp);
                    if (round === 4) {
                      //modal open with winners
                      setmodalIsOpen(true);
                    } else {
                      //show alert of the top 10
                    }
                  } else {
                    alert(temp);
                  }
                }}
              >
                {round === 2
                  ? `Move top 10 to the next round`
                  : round === 4
                  ? `select the winners`
                  : `you need to be in round 2 or 4`}
              </button>
              <Modal
                isOpen={modalIsOpen}
                onRequestClose={() => {
                  setmodalIsOpen(false);
                }}
                style={customStyles}
                contentLabel="Example Modal"
              >
                <div className="modal"> </div>
                <div className="modal_header">
                  <h2>the winners are</h2>
                  <button onClick={() => setmodalIsOpen(false)}>close</button>
                </div>
                <div className="winners">
                  <span></span>
                </div>
              </Modal>
            </div>
            <div className="middle">
              <h2
                onClick={() => {
                  console.log(finalScoreState);
                }}
              >
                Scores
              </h2>
              <span>
                Calculate current round
                {round === 2
                  ? ` 1 and 2 `
                  : round === 4
                  ? ` 3 and 4 `
                  : ` ${round} `}
                scores
              </span>
              <button onClick={currentRoundScoresCalculator}>Calculate</button>
            </div>
            <div className="right">
              {JSON.stringify(finalScoreState) !== "{}" ? (
                <>
                  <h5>
                    Contestants Numbers <br />
                    Order based on Round
                    {round === 2
                      ? ` 1 and 2 `
                      : round === 4
                      ? ` 3 and 4 `
                      : ` ${round} `}
                    points
                  </h5>
                  {Object.keys(finalScoreState)
                    .sort((a, b) => finalScoreState[a] - finalScoreState[b])
                    .reverse()
                    .map((key, index) => {
                      return (
                        <span>
                          {/* {JSON.stringify(finalScoreState[key])} */}
                          Contestant No : {key} - Placed : {Number(index + 1)} -
                          total points {finalScoreState[key]}
                        </span>
                      );
                    })}
                </>
              ) : (
                <h5>No Calculation has been done yet</h5>
              )}
            </div>
          </div>
        </div>
      );
    else {
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
            {/* <a href="#admin">Admin</a> */}
          </div>
          {/* <header className="App-header"> */}
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
                    <td>
                      Swim Suits, Healthy Body Figure, Audience Interaction
                    </td>
                    <td>30</td>
                  </tr>
                  <tr>
                    <td>Round4-Evening Wear</td>
                    <td>
                      Gown or Suit, Ability to answer judge question,
                      Authenticity and Individuality
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
                {maleIndex < males.length ? (
                  <>
                    <h3>Male Contestants</h3>
                    <span>
                      Contestant number : {males[maleIndex]?.ContestantNo}
                    </span>
                    <h4 id="contestant_name">{`${males[maleIndex]?.firstName} ${males[maleIndex]?.lastName}`}</h4>
                    <h4 id="contestant_name">
                      From {males[maleIndex]?.Nationality}
                    </h4>
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
                  <span>No More Male Contestants in this round</span>
                )}
              </form>
              <form className="contestant female" onSubmit={Submit}>
                {femaleIndex < females.length ? (
                  <>
                    <h3>Female Contestants</h3>
                    <span>
                      Contestant number : {females[femaleIndex]?.ContestantNo}
                    </span>
                    <h4 id="contestant_name">{`${females[femaleIndex]?.firstName} ${females[femaleIndex]?.lastName}`}</h4>
                    <h4 id="contestant_name">
                      From {females[femaleIndex]?.Nationality}
                    </h4>
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
                      {/* <div>
                        <span>Second Criticia</span>
                        <input
                          type="number"
                          placeholder="Second Cricitia"
                          max={10}
                          min={0}
                        />
                      </div>
                      <div>
                        <span>Third Criticia</span>
                        <input
                          type="number"
                          placeholder="Third Cricitia"
                          max={10}
                          min={0}
                        />
                      </div> */}
                    </div>
                    <div className="form_buttons">
                      <button type="submit">Submit</button>
                    </div>
                  </>
                ) : (
                  <span>No More Female Contestants in this round</span>
                )}
              </form>
            </div>
          </div>
          {/* </header> */}
          {/* <div class="admin_div" id="admin">
            <form onSubmit={Login}>
              <span>Login</span>
              <input type="text" name="username" placeholder="Username" />
              <input type="password" name="password" placeholder="Password" />
              <input type="submit" />
            </form>
          </div> */}
        </div>
      );
    }
  }
  return (
    <div className="App">
      <div class="admin_div" id="admin">
        <form onSubmit={Login}>
          <span>Login</span>
          <input type="text" name="username" placeholder="Username" />
          <input type="password" name="password" placeholder="Password" />
          <span id="error"></span>
          <input type="submit" />
        </form>
      </div>
    </div>
  );
}

export default App;
const customStyles = {
  content: {
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    transform: "translate(-50%, -50%)",
  },
};
