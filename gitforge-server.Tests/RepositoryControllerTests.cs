using Xunit;
using Microsoft.AspNetCore.Mvc;
using GitForge.Server.Controllers;
using GitForge.Server.Models;
using LibGit2Sharp;
using System.IO;

namespace GitForge.Server.Tests;

public class RepositoryControllerTests : IDisposable
{
    private readonly string _testRepoPath;

    public RepositoryControllerTests()
    {
        _testRepoPath = Path.Combine(Path.GetTempPath(), Path.GetRandomFileName());
        Repository.Init(_testRepoPath);
        
        using var repo = new Repository(_testRepoPath);
        File.WriteAllText(Path.Combine(_testRepoPath, "test.txt"), "content");
        Commands.Stage(repo, "test.txt");
        var signature = new Signature("Test", "test@test.com", System.DateTimeOffset.Now);
        repo.Commit("Initial commit", signature, signature);
    }

    public void Dispose()
    {
        if (Directory.Exists(_testRepoPath))
        {
            // LibGit2Sharp handles file locks, sometimes need to be careful with deletion
            var directory = new DirectoryInfo(_testRepoPath) { Attributes = FileAttributes.Normal };
            foreach (var info in directory.GetFileSystemInfos("*", SearchOption.AllDirectories))
            {
                info.Attributes = FileAttributes.Normal;
            }
            Directory.Delete(_testRepoPath, true);
        }
    }

    [Fact]
    public void GetStatus_ReturnsOk_WithFiles()
    {
        var controller = new RepositoryController();
        File.WriteAllText(Path.Combine(_testRepoPath, "new.txt"), "new content");

        var result = controller.GetStatus(_testRepoPath);

        var okResult = Assert.IsType<OkObjectResult>(result);
        var status = Assert.IsType<GitRepoStatus>(okResult.Value);
        Assert.Contains(status.Files, f => f.Path == "new.txt");
    }

    [Fact]
    public void CreateBranch_SuccessfullyCreatesBranch()
    {
        var controller = new RepositoryController();
        var branchName = "test-branch";

        var result = controller.CreateBranch(_testRepoPath, branchName, null);

        Assert.IsType<OkResult>(result);
        using var repo = new Repository(_testRepoPath);
        Assert.NotNull(repo.Branches[branchName]);
    }

    [Fact]
    public void GetBranches_ReturnsList()
    {
        var controller = new RepositoryController();
        var result = controller.GetBranches(_testRepoPath);

        var okResult = Assert.IsType<OkObjectResult>(result);
        var branches = Assert.IsAssignableFrom<System.Collections.IEnumerable>(okResult.Value);
        Assert.NotEmpty(branches);
    }

    [Fact]
    public void StageAndUnstage_WorkCorrectly()
    {
        var controller = new RepositoryController();
        var filePath = "new_file.txt";
        File.WriteAllText(Path.Combine(_testRepoPath, filePath), "content");

        // Stage
        var stageResult = controller.Stage(_testRepoPath, filePath);
        Assert.IsType<OkResult>(stageResult);

        using (var repo = new Repository(_testRepoPath))
        {
            var status = repo.RetrieveStatus(filePath);
            Assert.True(status.HasFlag(FileStatus.NewInIndex));
        }

        // Unstage
        var unstageResult = controller.Unstage(_testRepoPath, filePath);
        Assert.IsType<OkResult>(unstageResult);

        using (var repo = new Repository(_testRepoPath))
        {
            var status = repo.RetrieveStatus(filePath);
            Assert.True(status.HasFlag(FileStatus.NewInWorkdir));
        }
    }

    [Fact]
    public void Commit_CreatesNewCommit()
    {
        var controller = new RepositoryController();
        var filePath = "to_commit.txt";
        File.WriteAllText(Path.Combine(_testRepoPath, filePath), "content");
        controller.Stage(_testRepoPath, filePath);

        var request = new CommitRequest(_testRepoPath, "New feature commit", "Tester", "tester@test.com");
        var result = controller.Commit(request);

        Assert.IsType<OkResult>(result);
        using var repo = new Repository(_testRepoPath);
        Assert.Equal("New feature commit", repo.Head.Tip.MessageShort);
    }

    [Fact]
    public void GetLog_ReturnsCommits()
    {
        var controller = new RepositoryController();
        var result = controller.GetLog(_testRepoPath, 10);

        var okResult = Assert.IsType<OkObjectResult>(result);
        var commits = Assert.IsType<List<GitCommit>>(okResult.Value);
        Assert.NotEmpty(commits);
        Assert.Equal("Initial commit", commits[0].Message);
    }

    [Fact]
    public void StashOperations_WorkCorrectly()
    {
        var controller = new RepositoryController();
        var filePath = "stash_me.txt";
        File.WriteAllText(Path.Combine(_testRepoPath, filePath), "stash content");
        controller.Stage(_testRepoPath, filePath);
        
        // Push Stash
        var pushRequest = new CommitRequest(_testRepoPath, "Stash msg", "Tester", "tester@test.com");
        var pushResult = controller.PushStash(pushRequest);
        Assert.IsType<OkResult>(pushResult);

        // Get Stashes
        var getResult = controller.GetStashes(_testRepoPath);
        var okGetResult = Assert.IsType<OkObjectResult>(getResult);
        var stashes = Assert.IsType<List<GitStashItem>>(okGetResult.Value);
        Assert.Single(stashes);
        Assert.Contains("Stash msg", stashes[0].Message);

        // Pop Stash
        var popResult = controller.PopStash(_testRepoPath, 0);
        Assert.IsType<OkResult>(popResult);
        
        using (var repo = new Repository(_testRepoPath))
        {
            Assert.Empty(repo.Stashes);
        }
    }

    [Fact]
    public void Merge_WorksCorrectly()
    {
        var controller = new RepositoryController();
        
        // Create another branch and commit
        controller.CreateBranch(_testRepoPath, "other", null);
        using (var repo = new Repository(_testRepoPath))
        {
            Commands.Checkout(repo, "other");
            File.WriteAllText(Path.Combine(_testRepoPath, "other.txt"), "other content");
            Commands.Stage(repo, "other.txt");
            var sig = new Signature("Test", "test@test.com", System.DateTimeOffset.Now);
            repo.Commit("Commit on other", sig, sig);
            
            Commands.Checkout(repo, "master");
        }

        // Merge 'other' into master
        var request = new CommitRequest(_testRepoPath, "other", "Tester", "test@test.com");
        var result = controller.Merge(request);

        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.Contains("FastForward", okResult.Value.ToString());
        
        Assert.True(File.Exists(Path.Combine(_testRepoPath, "other.txt")));
    }

    [Fact]
    public void CherryPick_WorksCorrectly()
    {
        var controller = new RepositoryController();
        
        string otherSha;
        controller.CreateBranch(_testRepoPath, "cp-branch", null);
        using (var repo = new Repository(_testRepoPath))
        {
            Commands.Checkout(repo, "cp-branch");
            File.WriteAllText(Path.Combine(_testRepoPath, "cp.txt"), "cp content");
            Commands.Stage(repo, "cp.txt");
            var sig = new Signature("Test", "test@test.com", System.DateTimeOffset.Now);
            var commit = repo.Commit("CP commit", sig, sig);
            otherSha = commit.Id.Sha;
            
            Commands.Checkout(repo, "master");
        }

        // Cherry-pick the commit
        var request = new CommitRequest(_testRepoPath, otherSha, "Tester", "test@test.com");
        var result = controller.CherryPick(request);

        Assert.IsType<OkObjectResult>(result);
        Assert.True(File.Exists(Path.Combine(_testRepoPath, "cp.txt")));
    }

    [Fact]
    public void Checkout_WorksCorrectly()
    {
        var controller = new RepositoryController();
        var branchName = "checkout-test";
        controller.CreateBranch(_testRepoPath, branchName, null);

        // Checkout branch
        var result = controller.Checkout(_testRepoPath, branchName);
        Assert.IsType<OkResult>(result);

        using (var repo = new Repository(_testRepoPath))
        {
            Assert.Equal(branchName, repo.Head.FriendlyName);
        }

        // Checkout commit
        string tipSha;
        using (var repo = new Repository(_testRepoPath)) { tipSha = repo.Head.Tip.Sha; }
        var result2 = controller.Checkout(_testRepoPath, tipSha);
        Assert.IsType<OkResult>(result2);
    }

    [Fact]
    public void GetCommitChanges_ReturnsChanges()
    {
        var controller = new RepositoryController();
        string tipSha;
        using (var repo = new Repository(_testRepoPath)) { tipSha = repo.Head.Tip.Sha; }

        var result = controller.GetCommitChanges(_testRepoPath, tipSha);
        var okResult = Assert.IsType<OkObjectResult>(result);
        var changes = Assert.IsType<List<GitFileStatus>>(okResult.Value);
        Assert.NotEmpty(changes);
    }

    [Fact]
    public void GetDiff_ReturnsDiffData()
    {
        var controller = new RepositoryController();
        var filePath = "test.txt";
        File.WriteAllText(Path.Combine(_testRepoPath, filePath), "modified content");

        var result = controller.GetDiff(_testRepoPath, filePath);
        var okResult = Assert.IsType<OkObjectResult>(result);
        var diff = Assert.IsType<GitFileDiff>(okResult.Value);
        
        Assert.Equal("content", diff.OriginalContent);
        Assert.Equal("modified content", diff.ModifiedContent);
    }
}
