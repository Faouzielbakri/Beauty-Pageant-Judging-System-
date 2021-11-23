import { database, auth } from "./firebase";
import React, { useEffect, useState } from "react";
import Modal from "react-modal";
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

function Admin() {
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

  const [curentmale, setcurentmale] = useState({});
  const [curentfemale, setcurentfemale] = useState({});

  useEffect(() => {
    const sub = database
      .collection("currentContestants")
      .orderBy("ContestantNo")
      .onSnapshot((snapShot) => {
        if (!snapShot?.empty) {
          snapShot.forEach((contestant) => {
            //seperate the applications based on gendre
            if (contestant?.data().Gender === "male") {
              setcurentmale({ id: contestant.id, ...contestant.data() });
            } else {
              setcurentfemale({ id: contestant.id, ...contestant.data() });
            }
          });
        } else {
        }
      });
    return sub;
  }, []);

  //get all accepted applications ordered By contestant No.

  useEffect(() => {
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
            "no on is qualified to round 3 and 4\nmaybe ask to admin to calculte scores and move the contestants to round 3"
          );
        }
      });
    return sub;
  }, []);
  //get current round
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
  //reset when round changed
  useEffect(() => {
    setmaleIndex(0);
    setfemaleIndex(0);
  }, [round]);

  //move qualified to qualified collection
  const registerTopCualified = () => {
    database
      .collection("TopCualified")
      .get()
      .then((snapShot) => {
        if (snapShot.size !== 0) {
          snapShot.forEach((Doc) => {
            Doc.ref.delete();
          });
          setTimeout(() => {
            registerTopCualified();
          }, 100);
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
  //get placement text
  const placementtext = (placement) => {
    const last_digit = String(placement).split(".")[0].slice(-1);
    if (Number(last_digit) === 1) {
      if (String(placement).length === 1) {
        return "First place";
      } else {
        return `${placement}st`;
      }
    } else if (Number(last_digit) === 2) {
      if (String(placement).length === 1) {
        return "Second place";
      } else {
        return `${placement}nd`;
      }
    } else if (Number(last_digit) === 3) {
      if (String(placement).length === 1) {
        return "third place";
      } else {
        return `${placement}rd`;
      }
    }

    return `${placement}th`;
  };
  //get top from list
  const getTop = (limit = 10) => {
    let result = [];
    JSON.stringify(finalScoreState) !== "{}" &&
      Object.keys(finalScoreState)
        .sort((a, b) => finalScoreState[a] - finalScoreState[b])
        .reverse()
        .forEach((key, index) => {
          males.concat(females).forEach((human) => {
            if (human.ContestantNo === Number(key)) {
              result.push(human);
            }
          });
        });
    console.log(result);
    if (Array.isArray(result)) return result.filter((n) => n).slice(0, limit);
    else return "Calculate Scores First";
  };
  //get score from round number and ata obj
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

  //calculte the current round score
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
          }
        });
    });
  };
  //move to current contestant
  const Move = (indecator, gendre) => {
    if (gendre === "male") {
      if (maleIndex + indecator > males.length - 1) return;
      setmaleIndex(maleIndex + indecator);
    } else {
      if (femaleIndex + indecator > females.length - 1) return;
      setfemaleIndex(femaleIndex + indecator);
    }
  };
  //show current Contestant to the judges
  const Submit = (gendre) => {
    database
      .collection("currentContestants")
      .where("Gendre", "==", gendre)
      .get()
      .then((snapShot) => {
        if (snapShot.size === 0) {
          let TempHolder =
            gendre === "male" ? males[maleIndex] : females[femaleIndex];
          console.log(TempHolder);
          database
            .collection("currentContestants")
            .doc(`${TempHolder.id}`)
            .set(TempHolder)
            .then((doc) => {
              console.log("doc");
            })
            .catch((err) => {
              console.log(err);
            });
        } else {
          snapShot.forEach((doc) => {
            doc.ref.delete();
          });
          setTimeout(() => {
            Submit(gendre);
          }, 100);
        }
      });
  };
  return (
    <div className="App">
      <div className="nav_bar_container">
        <a href="#round">Round</a>
        <a
          href="#scores"
          onClick={() => {
            console.log(auth().currentUser.uid);
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
        <div className="round_controller">
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
        <div className="contestant_info_container">
          <div
            className={`contestant male  ${
              curentmale.ContestantNo === males[maleIndex]?.ContestantNo &&
              "sameContestant"
            }`}
            onSubmit={Submit}
          >
            {males.length - 1 > maleIndex ? (
              <>
                <h3 onClick={() => console.log(maleIndex)}>Male Contestants</h3>
                <span>
                  Contestant number : {males[maleIndex]?.ContestantNo}
                </span>
                <h4 id="contestant_name">{`${males[maleIndex]?.firstName} ${males[maleIndex]?.lastName}`}</h4>
                <h4 id="contestant_name">
                  From {males[maleIndex]?.Nationality}
                </h4>

                <div className="form_buttons">
                  {maleIndex !== 0 && (
                    <button
                      onClick={() => {
                        Move(-1, "male");
                      }}
                    >
                      Previous
                    </button>
                  )}
                  <button
                    onClick={() => {
                      Submit("male");
                    }}
                  >
                    Show
                  </button>

                  <button
                    onClick={() => {
                      Move(1, "male");
                    }}
                  >
                    Next
                  </button>
                </div>
              </>
            ) : (
              <>
                <span>No Male Contestant Available</span>
                <div className="form_buttons">
                  <button
                    onClick={() => {
                      Move(-1, "male");
                    }}
                  >
                    Previous
                  </button>
                </div>
              </>
            )}
          </div>
          <div
            className={`contestant female  ${
              curentfemale.ContestantNo ===
                females[femaleIndex]?.ContestantNo && "sameContestant"
            }`}
            onSubmit={Submit}
          >
            {females.length - 1 > femaleIndex ? (
              <>
                <h3>Female Contestants</h3>
                <span>
                  Contestant number : {females[femaleIndex]?.ContestantNo}
                </span>
                <h4 id="contestant_name">{`${females[femaleIndex]?.firstName} ${females[femaleIndex]?.lastName}`}</h4>
                <h4 id="contestant_name">
                  From {females[femaleIndex]?.Nationality}
                </h4>

                <div className="form_buttons">
                  {femaleIndex !== 0 && (
                    <button
                      onClick={() => {
                        Move(-1, "female");
                      }}
                    >
                      Previous
                    </button>
                  )}
                  <button
                    onClick={() => {
                      Submit("female");
                    }}
                  >
                    Show
                  </button>
                  <button
                    onClick={() => {
                      Move(1, "female");
                    }}
                  >
                    Next
                  </button>
                </div>
              </>
            ) : (
              <>
                <span>No Feale Contestant Available</span>
                <div className="form_buttons">
                  <button
                    onClick={() => {
                      Move(-1, "female");
                    }}
                  >
                    Previous
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
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
                console.log(temp);
                if (round === 4) {
                  //modal open with winners
                  setmodalIsOpen(true);
                } else {
                  //show alert of the top 10
                  setmodalIsOpen(true);
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
            <div className="modal">
              <div className="modal_header">
                <h2 onClick={() => console.log(top)}>
                  {round < 3 ? "Top 10" : `the winners`}
                </h2>
                <button onClick={() => setmodalIsOpen(false)}>x</button>
              </div>
              <div className="winners">
                {top.map((winner, index) => {
                  return (
                    <span>
                      {`${placementtext(index + 1)} - `}{" "}
                      <b>{` ${winner.firstName} ${winner.lastName} `}</b>{" "}
                    </span>
                  );
                })}
              </div>
              {round < 3 && (
                <button
                  onClick={() => {
                    registerTopCualified();
                  }}
                >
                  Move Top 10
                </button>
              )}
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
}

export default Admin;
