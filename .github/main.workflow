workflow "Build and test" {
  on = "push"
  resolves = ["Test"]
}

action "Build" {
  uses = "borales/actions-yarn@master"
  args = "install"
}

action "Test" {
  uses = "borales/actions-yarn@master"
  args = "test"
  needs = ["Build"]
}
