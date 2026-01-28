using Microsoft.AspNetCore.Mvc;
using LibGit2Sharp;
using GitForge.Server.Models;

namespace GitForge.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RepositoryController : ControllerBase
{
    [HttpGet("status")]
    public IActionResult GetStatus([FromQuery] string repoPath)
    {
        try
        {
            using var repo = new Repository(repoPath);
            var status = repo.RetrieveStatus();
            
            var files = status
                .Where(item => !item.State.HasFlag(FileStatus.Ignored))
                .Select(item => new GitFileStatus(
                    item.FilePath,
                    item.State.ToString()
                )).ToList();

            return Ok(new GitRepoStatus(repo.Head.FriendlyName, files));
        }
        catch (RepositoryNotFoundException)
        {
            return NotFound("Repository not found at the specified path.");
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }

    [HttpPost("branch/create")]
    public IActionResult CreateBranch([FromQuery] string repoPath, [FromQuery] string branchName, [FromQuery] string fromCommit)
    {
        try
        {
            using var repo = new Repository(repoPath);
            var commit = string.IsNullOrEmpty(fromCommit) ? repo.Head.Tip : repo.Lookup<Commit>(fromCommit);
            if (commit == null) return NotFound("Base commit not found");

            repo.Branches.Add(branchName, commit);
            return Ok();
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }

    [HttpPost("branch/delete")]
    public IActionResult DeleteBranch([FromQuery] string repoPath, [FromQuery] string branchName)
    {
        try
        {
            using var repo = new Repository(repoPath);
            var branch = repo.Branches[branchName];
            if (branch == null) return NotFound("Branch not found");
            
            repo.Branches.Remove(branch);
            return Ok();
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }

    [HttpPost("remote/fetch")]
    public IActionResult Fetch([FromQuery] string repoPath)
    {
        try
        {
            using var repo = new Repository(repoPath);
            var remote = repo.Network.Remotes["origin"];
            if (remote == null) return NotFound("No 'origin' remote found");

            var refSpecs = remote.FetchRefSpecs.Select(x => x.Specification);
            Commands.Fetch(repo, remote.Name, refSpecs, null, "Fetched by GitForge");
            return Ok();
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }

    [HttpPost("remote/pull")]
    public IActionResult Pull([FromBody] CommitRequest request)
    {
        try
        {
            using var repo = new Repository(request.RepoPath);
            var signature = new Signature(request.AuthorName, request.AuthorEmail, DateTimeOffset.Now);
            
            // Simple Pull: Fetch origin + Merge origin/current_branch
            var remote = repo.Network.Remotes["origin"];
            if (remote == null) return NotFound("No 'origin' remote found");

            var refSpecs = remote.FetchRefSpecs.Select(x => x.Specification);
            Commands.Fetch(repo, remote.Name, refSpecs, null, "Fetched by GitForge");

            var currentBranch = repo.Head;
            var trackedBranch = currentBranch.TrackedBranch;
            
            if (trackedBranch == null) return BadRequest("Current branch is not tracking a remote branch");

            var mergeResult = repo.Merge(trackedBranch, signature, new MergeOptions());
            
            if (mergeResult.Status == MergeStatus.Conflicts)
                return StatusCode(409, "Pull resulted in conflicts.");

            return Ok(new { Status = mergeResult.Status.ToString() });
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }

    [HttpPost("remote/push")]
    public IActionResult Push([FromQuery] string repoPath)
    {
        try
        {
            using var repo = new Repository(repoPath);
            var remote = repo.Network.Remotes["origin"];
            if (remote == null) return NotFound("No 'origin' remote found");
            
            // Note: LibGit2Sharp Push requires credentials. 
            // For MVP, we assume SSH agent or Credential Manager is active/configured globally.
            // Explicit auth UI is out of MVP scope.
            repo.Network.Push(repo.Head, new PushOptions());
            
            return Ok();
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }

    [HttpGet("text-graph")]
    public IActionResult GetTextGraph([FromQuery] string repoPath)
    {
        try
        {
            var psi = new System.Diagnostics.ProcessStartInfo
            {
                FileName = "git-graph",
                Arguments = "--color always --style round --no-pager",
                WorkingDirectory = repoPath,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                StandardOutputEncoding = System.Text.Encoding.UTF8
            };

            using var process = System.Diagnostics.Process.Start(psi);
            if (process == null) return StatusCode(500, "Failed to start git-graph process");
            
            var output = process.StandardOutput.ReadToEnd();
            process.WaitForExit();

            return Ok(new { Output = output });
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }

    [HttpGet("branches")]
    public IActionResult GetBranches([FromQuery] string repoPath)
    {
        try
        {
            using var repo = new Repository(repoPath);
            var branches = repo.Branches.Select(b => new 
            {
                Name = b.FriendlyName,
                IsRemote = b.IsRemote,
                IsCurrentRepositoryHead = b.IsCurrentRepositoryHead,
                TipSha = b.Tip.Sha
            }).ToList();

            return Ok(branches);
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }

    [HttpGet("log")]
    public IActionResult GetLog([FromQuery] string repoPath, [FromQuery] int count = 50)
    {
        try
        {
            using var repo = new Repository(repoPath);
            
            // Create a filter to include all branches (git log --all)
            var filter = new CommitFilter
            {
                SortBy = CommitSortStrategies.Time,
                IncludeReachableFrom = repo.Branches
            };

            var commits = repo.Commits.QueryBy(filter)
                .Take(count)
                .Select(c => new GitCommit(
                    c.Id.Sha,
                    c.Author.Name,
                    c.MessageShort,
                    c.Author.When,
                    c.Parents.Select(p => p.Id.Sha).ToList()
                ))
                .ToList();

            return Ok(commits);
        }
        catch (RepositoryNotFoundException)
        {
            return NotFound("Repository not found at the specified path.");
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }

    [HttpPost("stage")]
    public IActionResult Stage([FromQuery] string repoPath, [FromQuery] string filePath)
    {
        try
        {
            using var repo = new Repository(repoPath);
            Commands.Stage(repo, filePath);
            return Ok();
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }

    [HttpPost("unstage")]
    public IActionResult Unstage([FromQuery] string repoPath, [FromQuery] string filePath)
    {
        try
        {
            using var repo = new Repository(repoPath);
            Commands.Unstage(repo, filePath);
            return Ok();
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }

    [HttpPost("commit")]
    public IActionResult Commit([FromBody] CommitRequest request)
    {
        try
        {
            using var repo = new Repository(request.RepoPath);
            var signature = new Signature(request.AuthorName, request.AuthorEmail, DateTimeOffset.Now);
            repo.Commit(request.Message, signature, signature);
            return Ok();
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }

    [HttpPost("checkout")]
    public IActionResult Checkout([FromQuery] string repoPath, [FromQuery] string branchOrCommit)
    {
        try
        {
            using var repo = new Repository(repoPath);
            // Try to find branch first
            var branch = repo.Branches[branchOrCommit];
            if (branch != null)
            {
                Commands.Checkout(repo, branch);
            }
            else
            {
                // Try commit
                var commit = repo.Lookup<Commit>(branchOrCommit);
                if (commit != null)
                {
                    Commands.Checkout(repo, commit);
                }
                else 
                {
                    return NotFound("Branch or commit not found");
                }
            }
            return Ok();
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }

    [HttpPost("merge")]
    public IActionResult Merge([FromBody] CommitRequest request)
    {
        // reusing CommitRequest for simplicity: Message -> Branch/Commit to merge
        try
        {
            using var repo = new Repository(request.RepoPath);
            var signature = new Signature(request.AuthorName, request.AuthorEmail, DateTimeOffset.Now);
            
            // The 'Message' field in request holds the SHA or Branch name to merge
            var mergeTarget = request.Message; 

            // Try to lookup commit/branch
            Commit? commitToMerge = null;
            var branch = repo.Branches[mergeTarget];
            if (branch != null)
            {
                commitToMerge = branch.Tip;
            }
            else
            {
                commitToMerge = repo.Lookup<Commit>(mergeTarget);
            }

            if (commitToMerge == null) return NotFound("Target to merge not found");

            var result = repo.Merge(commitToMerge, signature, new MergeOptions());
            
            if (result.Status == MergeStatus.Conflicts)
            {
                return StatusCode(409, "Merge resulted in conflicts. Please resolve them manually.");
            }

            return Ok(new { Status = result.Status.ToString() });
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }

    [HttpPost("cherrypick")]
    public IActionResult CherryPick([FromBody] CommitRequest request)
    {
         // reusing CommitRequest: Message -> Commit SHA to pick
        try
        {
            using var repo = new Repository(request.RepoPath);
            var signature = new Signature(request.AuthorName, request.AuthorEmail, DateTimeOffset.Now);
            
            var commit = repo.Lookup<Commit>(request.Message);
            if (commit == null) return NotFound("Commit not found");

            var result = repo.CherryPick(commit, signature, new CherryPickOptions());

            if (result.Status == CherryPickStatus.Conflicts)
            {
                return StatusCode(409, "Cherry-pick resulted in conflicts.");
            }

            return Ok(new { Status = result.Status.ToString() });
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }

    [HttpGet("commit-changes")]
    public IActionResult GetCommitChanges([FromQuery] string repoPath, [FromQuery] string commitSha)
    {
        try
        {
            using var repo = new Repository(repoPath);
            var commit = repo.Lookup<Commit>(commitSha);
            if (commit == null) return NotFound("Commit not found");

            var changes = new List<GitFileStatus>();
            
            // Compare commit with its first parent
            var parent = commit.Parents.FirstOrDefault();
            var tree = commit.Tree;
            var parentTree = parent?.Tree;

            var diff = repo.Diff.Compare<TreeChanges>(parentTree, tree);

            foreach (var change in diff)
            {
                changes.Add(new GitFileStatus(change.Path, change.Status.ToString()));
            }

            return Ok(changes);
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }

    [HttpGet("commit-diff")]
    public IActionResult GetCommitDiff([FromQuery] string repoPath, [FromQuery] string commitSha, [FromQuery] string filePath)
    {
        try
        {
            using var repo = new Repository(repoPath);
            var commit = repo.Lookup<Commit>(commitSha);
            var parent = commit.Parents.FirstOrDefault();

            var blob = commit[filePath]?.Target as Blob;
            var modifiedContent = blob?.GetContentText() ?? "";

            var parentBlob = parent?[filePath]?.Target as Blob;
            var originalContent = parentBlob?.GetContentText() ?? "";

            return Ok(new GitFileDiff(filePath, originalContent, modifiedContent));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }

    [HttpGet("diff")]
    public IActionResult GetDiff([FromQuery] string repoPath, [FromQuery] string filePath)
    {
        try
        {
            using var repo = new Repository(repoPath);
            // This is a simplified diff logic. 
            // In a real app, we'd use repo.Diff.Compare() and parse the patch.
            // For MVP, we'll return content from HEAD vs WorkDir.
            
            var blob = repo.Head.Tip[filePath]?.Target as Blob;
            var originalContent = blob?.GetContentText() ?? "";
            
            var fullPath = Path.Combine(repoPath, filePath);
            var modifiedContent = System.IO.File.Exists(fullPath) ? System.IO.File.ReadAllText(fullPath) : "";

            return Ok(new GitFileDiff(filePath, originalContent, modifiedContent));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }

    [HttpGet("stashes")]
    public IActionResult GetStashes([FromQuery] string repoPath)
    {
        try
        {
            using var repo = new Repository(repoPath);
            var stashes = repo.Stashes.Select((s, index) => new GitStashItem(
                index,
                s.Message,
                s.Base.Author.When
            )).ToList();

            return Ok(stashes);
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }

    [HttpPost("stash/push")]
    public IActionResult PushStash([FromBody] CommitRequest request)
    {
        // Reusing CommitRequest: Message -> Stash Message
        try
        {
            using var repo = new Repository(request.RepoPath);
            var signature = new Signature("GitForge", "git@forge.com", DateTimeOffset.Now);
            repo.Stashes.Add(signature, request.Message);
            return Ok();
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }

    [HttpPost("stash/pop")]
    public IActionResult PopStash([FromQuery] string repoPath, [FromQuery] int index = 0)
    {
        try
        {
            using var repo = new Repository(repoPath);
            if (index < 0 || index >= repo.Stashes.Count()) return NotFound("Stash index out of range");
            
            repo.Stashes.Pop(index, new StashApplyOptions());
            return Ok();
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }

    [HttpPost("stash/drop")]
    public IActionResult DropStash([FromQuery] string repoPath, [FromQuery] int index = 0)
    {
        try
        {
            using var repo = new Repository(repoPath);
            if (index < 0 || index >= repo.Stashes.Count()) return NotFound("Stash index out of range");

            repo.Stashes.Remove(index);
            return Ok();
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }
}
