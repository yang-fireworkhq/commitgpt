export const defaultPromptTemplate = `Give me the commit messages based on the following diff:
{{diff}}
your answer should:
 - follow conventional commits
 - the message should start with one message title to conclude all the diff file change, title format should be: <type>[scope]: <description>
 - the message body should contain the detail of the change. Please go over all the diff file and the messages should be detailed as much as possible. 
 - (optional)if the branch name contain the ticket number, please include the ticket number in the message detail body(ref: ticket_number)

** only give me the commit message in your answer, no other warning or note should be included **

current branch name is {{currentBranch}}

examples:

fix(authentication): add password regex pattern

add password to regex pattern and check the detail password
fullfix the unit test
`