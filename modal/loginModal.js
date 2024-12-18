import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        require: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        require: true,
        unique: true,
        trim: true,
        lowercase: true,
        // match: [/\S+@\S+\.\S+/, "Invalid email format"],
    },
    password: {
        type: String,
        require: true,
        // minlength: 8
    },
    refreshToken: {
        type: String, // Token for password reset
        default: null,
      },
},
{
    timestamps: true
});

const Users = mongoose.model("User", userSchema);

export default Users;