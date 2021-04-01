const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { UserInputError } = require("apollo-server");

const {
  validateRegisterInput,
  validateLoginInput,
} = require("../../util/validators");
const { SECRET_KEY } = require("../../config");
const User = require("../../modules/User");

const avatars = [
  "https://react.semantic-ui.com/images/avatar/large/jenny.jpg",
  "https://react.semantic-ui.com/images/avatar/large/matthew.png",
  "https://react.semantic-ui.com/images/avatar/large/elliot.jpg",
  "https://react.semantic-ui.com/images/avatar/large/steve.jpg",
  "https://react.semantic-ui.com/images/avatar/large/molly.png",
  "https://react.semantic-ui.com/images/avatar/large/daniel.jpg"
]

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      username: user.username,
      avatar: user.avatar
    },
    SECRET_KEY,
    { expiresIn: "1h" }
  );
}

function hit(topInfluencers, influencer, influenced) {
  if (!topInfluencers[influencer]) {
    topInfluencers[influencer] = [];
  }
  if (!topInfluencers[influencer].includes(influenced)) {
    topInfluencers[influencer].push(influenced);
  }
}

function followChain(followings, topInfluencers, alreadyVerified = [], influencer = null, influenced = null) {
  followings.forEach((follow) => {
    let x = follow[0];
    let y = follow[1];
    if (influencer === null) {
      hit(topInfluencers, y, x);
      followChain(followings, topInfluencers, [], y, x);
    } else if (y === influenced && !alreadyVerified.includes(follow)) {
      alreadyVerified.push(follow);
      hit(topInfluencers, influencer, x);
      followChain(followings, topInfluencers, alreadyVerified, influencer, x)
    }
  });
}
function findInfluencers(followings) {
  let data = {};
  followChain(followings, data);

  let ranking = {};
  Object.entries(data).forEach(([key, value]) => {
    ranking[key] = value.length
  });


  return ranking;

}

module.exports = {
  Query: {
    async getRanking() {
      try {
        const users = await User.find({});
        if (!users) return [];
        
        let followings = [];
        users.forEach((user) => {
          user.followers.forEach((follower) => {
            followings.push([follower.username, user.username])
          });
        });
        let ranking = findInfluencers(followings);
        let arrayOfValues = Object.values(ranking);
        greatest = Math.max(...arrayOfValues);
      
        let mapping = []
        Object.keys(ranking).forEach((key) => {
          if (ranking[key] === greatest) {
            let user = users.find(user => user.username === key);
            let rank = {};
            rank.id = user.id;
            rank.username = key;
            rank.influences = greatest
            rank.avatar = user.avatar;
            rank.createdAt = user.createdAt
            mapping.push(rank);
          }
        });
        return mapping;
      } catch (err) {
        throw new Error(err);
      }
    },
    async getUser(_, { username }) {
      try {
        const user = await User.findOne({ username });
        if (user) {
          return user;
        } else {
          throw new Error("User not found");
        }
      } catch (err) {
        throw new Error(err);
      }
    },
  },
  Mutation: {
    async login(_, { username, password }) {
      const { errors, valid } = validateLoginInput(username, password);

      if (!valid) {
        throw new UserInputError("Errors", { errors });
      }

      const user = await User.findOne({ username });

      if (!user) {
        errors.general = "User not found";
        throw new UserInputError("User not found", { errors });
      }

      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        errors.general = "Wrong credentials";
        throw new UserInputError("Wrong credentials", { errors });
      }

      const token = generateToken(user);

      return {
        ...user._doc,
        id: user._id,
        token,
      };
    },
    async follow(_, { username, follower }){
      const { errors, valid } = validateLoginInput(username, follower);

      if (!valid) {
        throw new UserInputError("Errors", { errors });
      }

      const user = await User.findOne({ username });

      if (!user) {
        errors.general = "User not found";
        throw new UserInputError("User not found", { errors });
      }
      const followerUser = await User.findOne({ username: follower });

      if (!followerUser) {
        errors.general = "Follower not found";
        throw new UserInputError("Follower not found", { errors });
      }

      if (user.followers.find((like) => like.username === follower)) {
        // User already following, unfollow it
        user.followers = user.followers.filter((like) => like.username !== follower);
      } else {
        // Not following, follow user
        user.followers.push({
          username: follower,
          createdAt: new Date().toISOString(),
        });
      }

      await user.save();
      return user;
    },
    async register(
      _,
      { registerInput: { username, email, password, confirmPassword } }
    ) {
      // TODO: Validate user data

      const { valid, errors } = validateRegisterInput(
        username,
        email,
        password,
        confirmPassword
      );

      if (!valid) {
        throw new UserInputError("Errors", { errors });
      }
      const user = await User.findOne({ username });
      if (user) {
        throw new UserInputError("Username is taken", {
          errors: {
            username: "This username is taken",
          },
        });
      }
      password = await bcrypt.hash(password, 12);

      const newUser = new User({
        email,
        username,
        password,
        avatar: avatars[Math.floor(Math.random() * avatars.length)],
        createdAt: new Date().toISOString(),
      });

      const res = await newUser.save();

      const token = generateToken(res);

      return {
        ...res._doc,
        id: res._id,
        token,
      };
    },
  },
};
