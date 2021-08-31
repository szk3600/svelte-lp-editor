import GitHub from 'github-api';

const gitHub = new GitHub({
  token: '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'
});

export const pushFiles = async (userName, repoName, branchName, message, files) => {
	let repo = getRepo (userName, repoName);
	let branch = await getBranch (repo,branchName);
	if (!branch) error('Branch:' + branchName + ' not found for Repo '
										 + userName + '/' + repoName +'.');
	const commitSHA = await getCommitSHA (repo,branch);
	const treeSHA = await getTreeSHA (repo,commitSHA);
	const filesToCommit = await createFiles (repo,files);
	const newTreeSHA = await createTree (repo, filesToCommit,treeSHA);
	const newCommitSHA = await createCommit(repo, message,commitSHA,newTreeSHA);
	return await updateHead (repo, branchName,newCommitSHA);
}

const getRepo = (userName, repoName) => {
	return gitHub.getRepo(userName, repoName);
}

const listBranches = async (repo) => {
  return await repo.listBranches();
}

const getBranch = async (repo, branchName) => {
  const branches = await listBranches(repo);
	if (branches) {
    return branches.data.find( branch => branch.name === branchName );
	} else {
		return null;
	};
};

const getCommitSHA = async (repo, branch) => {
	let ref = await repo.getRef('heads/' + branch.name);
	return ref.data.object.sha;
}

const getTreeSHA = async (repo, commitSHA) => {
	let commit = await repo.getCommit(commitSHA);
  return commit.data.tree.sha; 
}

const createFiles = (repo, files) => {
  let promises = [];
	for (const file of files) {
		promises.push(createFile(repo,file));
	}
	return Promise.all(promises);
}

const createFile = async (repo, file) => {
  const blob = await repo.createBlob(file.content);
	return {
		sha: blob.data.sha,
    path: file.path,
    mode: '100644',
    type: 'blob'};  
};

const createTree = async (repo, filesToCommit, treeSHA) => {
  const tree = await repo.createTree(filesToCommit, treeSHA);
	return tree.data.sha;
};

const createCommit = async (repo, message, commitSHA, newTreeSHA) => {
	const commit = await repo.commit(commitSHA, newTreeSHA, message);
	return commit.data.sha;
};

const	updateHead = async (repo, branchName,newCommitSHA) => {
  return await repo.updateHead( 'heads/' + branchName, newCommitSHA );
};
