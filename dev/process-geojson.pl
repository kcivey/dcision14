#!/usr/bin/perl -w
use strict;
use JSON;

@ARGV = ('November_4_2014_General_Election_Unofficial_Results.csv') if not @ARGV;
$_ = <>;
chomp;
my @v;
my %ward;
my @columns = map { chomp; s/["\r\n]//g; lc } split /,/;
while (<>) {
    s/\s+$//;
    s/^"//; s/"$//;
    my %r;
    @r{@columns} = split /","/;
    next if $r{candidate} =~ /ER VOTES$/ or $r{contest_name} =~ /^ADVISORY NEIGHBORHOOD/;
    my $contest = $r{contest_name};
    my $candidate = $r{candidate};
    my $precinct = $r{precinct_number} + 0;
    if ($contest =~ /- TOTAL/) {
        $contest =~ s/ .*//;
        $v[$precinct]{$contest} = $r{votes} + 0;
        next;
    }
    $contest =~ s/ - /-/;
    $contest =~ s/(\w+)/\u\L$1/g;
    $contest =~ s/(?<= )(Of|The)(?= )/\L$1/g;
    $contest =~ s/(?: of the)? District of Columbia//;
    $contest =~ s/One/1/;
    $contest =~ s/Three/3/;
    $contest =~ s/Five/5/;
    $contest =~ s/Six/6/;
    $candidate =~ s/ INITIATIVE 71//;
    $candidate =~ s/.* //;
    $candidate =~ s/(\w+)/\u\L$1/g;
    $candidate = '[Write-in]' if $candidate eq 'Write-In';
    $candidate =~ s/^Labeaume/LaBeaume/;
    if ($ward{$r{precinct_number}} && $ward{$r{precinct_number}} != $r{ward}) {
        warn "Precinct $r{precinct_number} is Ward $ward{$r{precinct_number}}" .
            " and $r{ward}\n";
    }
    $ward{$r{precinct_number}} = $r{ward} + 0;
    $v[$precinct]{$contest}{$candidate} = $r{votes} + 0;
}
print to_json(\@v, {canonical => 1});

@ARGV = ('dc-precincts-2012.json');
$/ = undef;
$_ = <>;
my $data = decode_json($_);
for my $f (@{$data->{features}}) {
    my $pct = $f->{properties}{Description} =~ /Precinct (\d+)/ ? $1 : 0;
    $f->{id} = $pct + 0;
    $f->{properties} = {ward => $ward{$pct}};
    $f->{geometry} = $f->{geometry}{geometries}[1];
}
#print to_json($data, {canonical => 1});
warn scalar(@{$data->{features}}), " precincts\n";
